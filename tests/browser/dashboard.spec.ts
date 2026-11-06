import { test, expect, type Page } from '@playwright/test';
import { dashboardHtml, type DashboardBootstrap } from '../../lib/dashboard-html';

async function finishMenuAnimation(page: Page) {
  await page.locator('.hamburger-layout').evaluate(async layout => {
    const animations = [...layout.getAnimations(), ...layout.querySelector('.sidebar')!.getAnimations({ subtree: true })]
      .filter(animation => animation.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  });
}
async function openNavigation(page: Page) {
  const toggle = page.locator('#menuToggle');
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await finishMenuAnimation(page);
}
async function selectWorkspace(page: Page, workspace: string) {
  await openNavigation(page);
  await page.locator(`.nav-item[data-page="${workspace}"]`).click();
  await expect(page.locator('#menuToggle')).toHaveAttribute('aria-expanded', 'false');
}

test('login, seluruh menu referensi, filter dan logout berfungsi', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  expect((await request.get('/api/dashboard')).status()).toBe(401);
  expect((await request.get('/api/tickets?date=2026-11-04')).status()).toBe(401);
  expect((await request.get('/api/cron/sync')).status()).toBe(401);
  expect((await request.get('/api/cron/morning')).status()).toBe(401);
  expect((await request.post('/api/bot/unspec', { headers: { Authorization: 'Bearer wrong-token' } })).status()).toBe(401);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MONITORING UNSPEC SULBAGSEL');
  await expect(page).toHaveTitle('MONITORING UNSPEC SULBAGSEL');
  await page.getByLabel('Username').fill('Sulbagsel');
  await page.getByLabel('Password').fill('salah');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('.login-error')).toContainText('salah');
  await page.getByLabel('Password').fill('browser-test-password');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MONITORING UNSPEC SULBAGSEL');
  await expect(page).toHaveTitle('MONITORING UNSPEC SULBAGSEL');
  await expect(page.locator('#cards .card')).toHaveCount(7);
  await expect(page.locator('#cards .card').nth(5).locator('.achieved-icon svg')).toHaveCount(1);
  await expect(page.locator('#syncStatus')).toContainText('Neon belum dikonfigurasi');
  await expect(page.locator('#orders')).not.toContainText('Memuat detail');
  await page.screenshot({ path: test.info().outputPath('dashboard-light.png') });
  await expect(page.locator('.trend-panel .detailhead h2')).toHaveText('Tren Harian Sulbagsel');
  await expect(page.locator('#chart .regional-trend-card > b')).toHaveText('Sulbagsel');
  await expect(page.locator('#chart .branch-trend-heading')).toHaveText('Tren Harian Branch');
  await expect(page.locator('#chart .daily-trend-card > b').nth(1)).toHaveText('BONE');
  await expect(page.locator('#legend')).toBeHidden();
  await expect(page.locator('.app-content > .foot')).toHaveCount(0);
  const performanceLayout = await page.locator('#branchPerformanceTable').evaluate(table => {
    const wrap = table.parentElement!;
    return { scrollWidth: wrap.scrollWidth, width: wrap.clientWidth, border: getComputedStyle(table.querySelector('td')!).borderLeftWidth };
  });
  expect(performanceLayout.scrollWidth).toBeLessThanOrEqual(performanceLayout.width + 1);
  expect(performanceLayout.border).toBe('1px');
  await selectWorkspace(page, 'monthly');
  await expect(page.getByRole('heading', { name: 'Tren Bulanan Sulbagsel', exact: true })).toBeVisible();
  await expect(page.locator('#monthlyChart > div > b').first()).toHaveText('Sulbagsel');
  await expect(page.locator('#monthlyChart .monthly-branch-heading')).toHaveText('Tren Bulanan Branch');
  await expect(page.locator('#monthlyChart > div > b').nth(1)).toHaveText('BONE');
  await selectWorkspace(page, 'progress');
  await page.locator('#branch').selectOption('MAKASSAR');
  await expect(page.locator('#chart .daily-trend-card')).not.toHaveCount(0);
  await expect(page.locator('#chart .branch-trend-heading')).toHaveCount(1);
  await expect(page.locator('#chart .daily-trend-card > b').first()).toHaveText('MAKASSAR');
  const branchChart = await page.locator('#chart .main-trend-card svg').boundingBox();
  expect(branchChart!.width / branchChart!.height).toBeCloseTo(550 / 200, 1);
  await page.locator('#sa').selectOption('SERVICE AREA TAMALANREA');
  await expect(page.locator('#chart .daily-trend-card')).toHaveCount(1);
  await expect(page.locator('#chart .main-trend-card > b')).toHaveText('SERVICE AREA TAMALANREA');
  const areaChart = await page.locator('#chart .main-trend-card svg').boundingBox();
  expect(areaChart!.width / areaChart!.height).toBeCloseTo(550 / 200, 1);
  expect(areaChart!.height).toBeGreaterThan(205);
  await page.locator('#sa').selectOption('');
  await selectWorkspace(page, 'monthly');
  await expect(page.locator('#page-monthly')).toBeVisible();
  await expect(page.locator('#monthlyChart svg')).not.toHaveCount(0);
  await expect(page.locator('#monthlyChart .monthly-branch-heading')).toHaveCount(1);
  await expect(page.locator('#monthlyChart > div > b').first()).toHaveText('MAKASSAR');
  await selectWorkspace(page, 'business');
  await expect(page.locator('#imjasTable tr')).not.toHaveCount(0);
  await expect(page.locator('#regionalImjasHeading')).toBeVisible();
  await expect(page.locator('#regionalImjasHeading')).toContainText('Realisasi & Loss Regional Sulbagsel');
  expect(await page.locator('#imjasCards').evaluate(cards => !!(cards.compareDocumentPosition(document.getElementById('imjasBranchCards')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'IMJAS · Kontribusi KPI UNSPEC', exact: true })).toHaveCount(0);
  const splitCard = page.locator('#imjasBranchCards .card[data-card-tone="split"]').first();
  await expect(splitCard).toBeVisible();
  const splitColors = await splitCard.evaluate(card => ({ top: card.style.getPropertyValue('--card-top-tint'), bottom: card.style.getPropertyValue('--card-bottom-tint') }));
  expect(splitColors).toEqual({ top: '#e2f4e9', bottom: '#fbe4e9' });
  await expect(page.locator('#imjasTrend .imjas-legend > span')).toHaveCount(3);
  const legendLayout = await page.locator('#imjasTrend .imjas-legend').evaluate(legend => ({
    height: legend.getBoundingClientRect().height,
    icons: Array.from(legend.querySelectorAll('svg'), icon => ({ width: icon.getBoundingClientRect().width, height: icon.getBoundingClientRect().height })),
  }));
  expect(legendLayout.height).toBeLessThan(80);
  for (const icon of legendLayout.icons) expect(icon).toEqual({ width: 35, height: 12 });
  await page.locator('#imjasMonthFilter').selectOption('2026-11');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: test.info().outputPath('dashboard-mobile.png') });
  const mobileLegend = await page.locator('#imjasTrend .imjas-legend').evaluate(legend => ({ width: legend.clientWidth, scrollWidth: legend.scrollWidth }));
  expect(mobileLegend.scrollWidth).toBeLessThanOrEqual(mobileLegend.width + 1);
  await selectWorkspace(page, 'progress');
  await expect(page.locator('#cards .card')).toHaveCount(7);
  await expect(page.locator('#branch')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const mobilePerformance = await page.locator('#branchPerformanceTable').evaluate(table => ({ width: table.parentElement!.clientWidth, scrollWidth: table.parentElement!.scrollWidth }));
  expect(mobilePerformance.width).toBeGreaterThan(0);
  expect(mobilePerformance.scrollWidth).toBeLessThanOrEqual(mobilePerformance.width + 1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: test.info().outputPath('dashboard-mobile-progress.png') });
  await openNavigation(page);
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test('logo hamburger membuka menu beranimasi, mendukung keyboard dan mobile tanpa mereset filter', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state: DashboardBootstrap = {
    persisted: true, error: null, syncedAt: '2026-11-05T06:00:00Z',
    snapshots: { '2026-11-04': { ANT: 2 }, '2026-11-05': { ANT: 1 } },
    mapping: { ANT: { branch: 'MAKASSAR', sa: 'SERVICE AREA TAMALANREA', region: 'SULBAGSEL' } },
  };
  await page.route('**/dashboard', async route => route.fulfill({ contentType: 'text/html', body: await dashboardHtml(state) }));
  await page.route('**/api/dashboard', route => route.fulfill({ json: state }));
  await page.route('**/api/tickets?*', route => route.fulfill({ json: { tickets: [{ INCIDENT: 'INC-TEST', WORKZONE: 'ANT' }] } }));
  await page.goto('/dashboard');
  const toggle = page.getByRole('button', { name: 'Buka menu UNSPEC', exact: true });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#sidebarMenu')).toBeHidden();
  expect(await page.locator('#sidebarMenu').evaluate(menu => (menu as HTMLElement).inert)).toBeTruthy();
  await toggle.focus();await page.keyboard.press('Tab');
  await expect(page.locator('#date')).toBeFocused();
  await page.screenshot({ path: test.info().outputPath('hamburger-closed.png') });
  await page.locator('#branch').selectOption('MAKASSAR');
  await openNavigation(page);
  await expect(page.locator('#sidebarMenu .nav-item')).toHaveCount(3);
  await expect(page.locator('#sidebarMenu .nav-item').first()).toBeVisible();
  await expect(page.locator('#sidebarMenu .theme-button')).toBeVisible();
  await expect(page.locator('#sidebarMenu .logout-button')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('hamburger-open.png') });
  await page.keyboard.press('Escape');
  await expect(page.locator('#menuToggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menuToggle')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#menuToggle')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.nav-item[data-page="monthly"]').click();
  await expect(page.locator('#page-monthly')).toBeVisible();
  await expect(page.locator('#menuToggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#branch')).toHaveValue('MAKASSAR');
  await page.setViewportSize({ width: 390, height: 844 });
  await openNavigation(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Mode Malam', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await finishMenuAnimation(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: test.info().outputPath('hamburger-mobile-dark.png') });
  await page.keyboard.press('Escape');
  await expect(page.locator('#menuToggle')).toHaveAttribute('aria-expanded', 'false');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('#page-progress')).toBeVisible();
  await expect(page.locator('#page-monthly')).toBeVisible();
  await expect(page.locator('#page-business')).toBeVisible();
  expect(errors).toEqual([]);
});

test('kartu Saldo H menampilkan selisih dan ikon sesuai perubahan H-1', async ({ page }) => {
  const state: DashboardBootstrap = {
    persisted: true, error: null, syncedAt: '2026-11-05T06:00:00Z',
    snapshots: { '2026-11-02': { ANT: 411 }, '2026-11-03': { ANT: 389 }, '2026-11-04': { ANT: 400 }, '2026-11-05': { ANT: 400 } },
    mapping: { ANT: { branch: 'MAKASSAR', sa: 'SERVICE AREA TAMALANREA', region: 'SULBAGSEL' } },
  };
  await page.route('**/dashboard', async route => route.fulfill({ contentType: 'text/html', body: await dashboardHtml(state) }));
  await page.route('**/api/dashboard', route => route.fulfill({ json: state }));
  await page.route('**/api/tickets?*', route => {
    const date = new URL(route.request().url()).searchParams.get('date')!;
    return route.fulfill({ json: { tickets: Array.from({ length: state.snapshots[date].ANT }, (_, i) => ({ INCIDENT: 'INC-'+i, WORKZONE: 'ANT' })) } });
  });
  await page.goto('/dashboard');
  const card = page.locator('#cards .card').first();
  await expect(page.locator('#chart .main-trend-card .daily-trend-areas path[data-direction="down"]')).toHaveCount(2);
  await expect(page.locator('#chart .main-trend-card .daily-trend-areas path[data-direction="up"]')).toHaveCount(3);
  await expect(page.locator('#chart .main-trend-card .daily-trend-lines line[data-direction="down"]').first()).toHaveAttribute('stroke', '#148060');
  await expect(page.locator('#chart .main-trend-card .daily-trend-lines line[data-direction="up"]').first()).toHaveAttribute('stroke', '#c72e43');
  await expect(page.locator('#chart .main-trend-card .daily-point-label rect')).toHaveCount(4);
  await expect(page.locator('#chart .main-trend-card circle[data-target-status="above"]')).toHaveCount(3);
  await expect(page.locator('#chart .main-trend-card circle[data-target-status="met"]')).toHaveCount(1);
  await page.locator('#metric').selectOption('saldo');
  await expect(page.locator('#chart .main-trend-card .daily-trend-areas path[data-direction="down"]')).toHaveCount(2);
  await expect(page.locator('#chart .main-trend-card .daily-point-label rect')).toHaveCount(4);
  await expect(card.locator('.balance-change')).toContainText('Tetap · selisih 0 tiket');
  await page.locator('#date').selectOption('2026-11-04');
  await expect(card.locator('.balance-change.red')).toContainText('Naik 11 tiket');
  await expect(card).toHaveAttribute('data-card-tone', 'red');
  await expect(card.locator('.lucide-trending-up')).toBeVisible();
  await page.locator('#date').selectOption('2026-11-03');
  await expect(card.locator('.balance-change.green')).toContainText('Turun 22 tiket');
  await expect(card).toHaveAttribute('data-card-tone', 'green');
  expect(await card.evaluate(element => getComputedStyle(element).backgroundImage)).toContain('linear-gradient');
  expect(await page.locator('#chart .daily-trend-card').first().evaluate(element => getComputedStyle(element).backgroundImage)).toBe('none');
  await expect(card.locator('.lucide-trending-down')).toBeVisible();
  await expect(card.locator('.balance-change')).toContainText('dibanding saldo H-1');
  await page.locator('#date').selectOption('2026-11-02');
  await expect(card.locator('.balance-change.muted')).toContainText('Belum ada pembanding');
  await expect(card.locator('.balance-change')).toContainText('Snapshot H-1 belum tersedia');
});

test('keterangan saldo H-1 dan warna realisasi serta achieved mengikuti target', async ({ page }) => {
  const state: DashboardBootstrap = {
    persisted: true, error: null, syncedAt: '2026-11-05T06:00:00Z',
    snapshots: { '2026-11-03': { ANT: 435 }, '2026-11-04': { ANT: 411 }, '2026-11-05': { ANT: 389 } },
    mapping: { ANT: { branch: 'MAKASSAR', sa: 'SERVICE AREA TAMALANREA', region: 'SULBAGSEL' } },
  };
  await page.route('**/dashboard', async route => route.fulfill({ contentType: 'text/html', body: await dashboardHtml(state) }));
  await page.route('**/api/dashboard', route => route.fulfill({ json: state }));
  await page.route('**/api/tickets?*', route => {
    const date = new URL(route.request().url()).searchParams.get('date')!;
    return route.fulfill({ json: { tickets: Array.from({ length: state.snapshots[date].ANT }, (_, i) => ({ INCIDENT: 'INC-'+i, WORKZONE: 'ANT' })) } });
  });
  await page.goto('/dashboard');
  const cards = page.locator('#cards .card');
  await expect(cards.nth(1)).toContainText('Saldo pada tanggal 4');
  await expect(cards.nth(4).locator('.value.green')).toHaveText('0,10%');
  await expect(cards.nth(5).locator('.value.green')).toHaveText('100,00%');
  await expect(cards.nth(5).getByRole('meter', { name: 'Achieved' })).toHaveAttribute('aria-valuenow', '100');
  await expect(cards.nth(5).locator('.gauge-needle')).toHaveCSS('transition-duration', '0.65s');
  await expect.poll(() => cards.nth(5).locator('.gauge-needle').evaluate(needle => needle.getAttribute('style'))).toContain('rotate(90deg)');
  await expect(cards.nth(4)).toHaveAttribute('data-card-tone', 'green');
  await expect(cards.nth(5)).toHaveAttribute('data-card-tone', 'green');
  await page.locator('#date').selectOption('2026-11-03');
  await expect(cards.nth(4).locator('.value.red')).toHaveText('0,11%');
  await expect(cards.nth(4)).toHaveAttribute('data-card-tone', 'red');
  await expect(cards.nth(5).locator('.value.red')).not.toHaveText('100,00%');
  const gauge = cards.nth(5).getByRole('meter', { name: 'Achieved' });
  const percent = Number(await gauge.getAttribute('aria-valuenow'));
  expect(percent).toBeGreaterThan(0);expect(percent).toBeLessThan(100);
  await expect.poll(() => cards.nth(5).locator('.gauge-needle').evaluate(needle => Number.parseFloat((needle as SVGElement).style.transform.replace('rotate(','')))).toBeCloseTo(percent*1.8-90, 3);
  await expect(cards.nth(1)).toContainText('Saldo tanggal sebelumnya belum tersedia');
  // Realisasi follows the displayed two-decimal percentage; achieved keeps its own target rule.
  await page.locator('#date').selectOption('2026-11-04');
  await expect(cards.nth(4).locator('.value.green')).toHaveText('0,10%');
  await expect(cards.nth(5).locator('.value.red')).not.toHaveText('100,00%');
});

test('refresh mempertahankan saldo terakhir selama API baru masih dimuat atau gagal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-11-05T06:00:00Z') });
  const state: DashboardBootstrap = {
    persisted: true, error: null, syncedAt: '2026-11-05T05:57:04Z',
    snapshots: { '2026-10-30': { ANT: 500 }, '2026-11-04': { ANT: 411 }, '2026-11-05': { ANT: 1119 } },
    mapping: { ANT: { branch: 'MAKASSAR', sa: 'SERVICE AREA TAMALANREA', region: 'SULBAGSEL' } },
  };
  const pending: Array<() => void> = [];
  let fail = false;
  await page.route('**/dashboard', async route => route.fulfill({ contentType: 'text/html', body: await dashboardHtml(state) }));
  await page.route('**/api/dashboard', async route => {
    await new Promise<void>(resolve => pending.push(resolve));
    return route.fulfill(fail ? { status: 503, json: { error: 'API sementara gagal.' } } : { json: state });
  });
  await page.route('**/api/tickets?*', route => route.fulfill({ json: { tickets: Array.from({ length: state.snapshots['2026-11-05'].ANT }, (_, i) => ({ INCIDENT: 'INC-'+i, WORKZONE: 'ANT' })) } }));
  await page.goto('/dashboard');
  await expect.poll(() => pending.length).toBe(1);
  await expect(page.locator('#syncProgress')).toBeVisible();
  await expect(page.locator('main')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#date')).toHaveValue('2026-11-05');
  await expect(page.locator('#cards .card').first().locator('.value')).toHaveText('1.119');
  state.snapshots['2026-11-05'].ANT = 1120;
  state.syncedAt = '2026-11-05T06:00:00Z';
  pending[0]();
  await expect(page.locator('#cards .card').first().locator('.value')).toHaveText('1.120');
  await expect(page.locator('#syncProgress')).toBeHidden();
  await openNavigation(page);
  await page.getByRole('button', { name: 'Mode Malam', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Mode Siang', exact: true })).toBeVisible();
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(9, 9, 9)');
  expect(await page.locator('.trend-panel').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(23, 23, 23)');
  await page.screenshot({ path: test.info().outputPath('dashboard-dark.png') });
  await expect(page.locator('.notice:visible')).toHaveCount(0);
  await expect(page.locator('#message')).toBeHidden();
  await page.locator('#import').click();
  await expect(page.locator('#message')).toContainText('Pilih file CSV dan tanggal snapshot.');
  expect(await page.locator('#message').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(36, 36, 36)');
  const gapBackgrounds = await page.locator('#branchPerformanceTable tbody td:nth-child(5)').evaluateAll(cells => cells.map(cell => getComputedStyle(cell).backgroundColor));
  expect(gapBackgrounds.length).toBeGreaterThan(0);
  expect(gapBackgrounds).not.toContain('rgb(255, 255, 255)');
  expect(await page.locator('#branchPerformanceTable tr.regional-total td:nth-child(5)').evaluate(cell => getComputedStyle(cell).backgroundColor)).toBe('rgb(38, 38, 38)');
  expect(await page.locator('#cards .card[data-card-tone="red"]').first().evaluate(element => getComputedStyle(element).backgroundImage)).toContain('rgb(70, 37, 50)');
  expect(await page.locator('.card[data-card-tone="green"]').first().evaluate(element => getComputedStyle(element).backgroundImage)).toContain('rgb(23, 62, 49)');
  expect(await page.locator('#cards .card').first().evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
  await page.reload();
  await expect.poll(() => pending.length).toBe(2);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#syncProgress')).toBeVisible();
  await expect(page.locator('#date')).toHaveValue('2026-11-05');
  await expect(page.locator('#cards .card').first().locator('.value')).toHaveText('1.120');
  fail = true;
  pending[1]();
  await expect(page.locator('#syncStatus')).toContainText('API sementara gagal');
  await expect(page.locator('#syncProgress')).toBeHidden();
  await openNavigation(page);
  await page.getByRole('button', { name: 'Mode Siang', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.locator('#cards .card').first().evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
  await expect(page.locator('#cards .card').first().locator('.value')).toHaveText('1.120');
  expect(errors).toEqual([]);
});

test('periode berlanjut otomatis dan saldo mengikuti WORKZONE unik', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2027-01-02T04:00:00Z') });
  let syncRequests = 0, liveBalance = 1;
  await page.route('**/api/dashboard', route => {
    if (route.request().method() === 'POST') syncRequests++;
    return route.fulfill({ json: {
    persisted: true, error: null, syncedAt: '2027-01-02T04:00:00Z',
    snapshots: { '2026-10-30': { ANT: 2 }, '2026-11-30': { ANT: 2 }, '2026-12-31': { ANT: 2 }, '2027-01-02': { ANT: liveBalance } },
    mapping: { ANT: { branch: 'MAKASSAR', sa: 'SERVICE AREA TAMALANREA', region: 'SULBAGSEL' } },
  } });
  });
  await page.route('**/api/tickets?*', route => route.fulfill({ json: { tickets: Array.from({ length: liveBalance }, (_, i) => ({ INCIDENT: 'INC-TEST-'+i, WORKZONE: 'ANT', 'CUSTOMER NAME': 'Pelanggan uji', 'SERVICE NO': '0001', 'REPORTED DATE': '2027-01-02', STATUS: 'BACKEND', SUMMARY: 'Uji' })) } }));
  await page.goto('/login');
  await page.getByLabel('Username').fill('Sulbagsel');
  await page.getByLabel('Password').fill('browser-test-password');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.locator('#syncStatus')).toContainText('Pembaruan terakhir');
  await expect.poll(() => syncRequests).toBe(1);
  await expect(page.locator('#date')).toHaveValue('2027-01-02');
  await expect(page.locator('#cards .card').first().locator('.value')).toHaveText('1');
  await expect(page.locator('#branches tr').first().locator('td').nth(5)).toHaveText('29');
  await selectWorkspace(page, 'monthly');
  await expect(page.locator('#monthlyCards .card')).toHaveCount(7);
  await expect(page.locator('#monthlyHeading')).toContainText('Januari 2027');
  await expect(page.locator('#monthlyCards .card').last()).toContainText('JANUARI 2027 MTD');
  await selectWorkspace(page, 'business');
  await expect(page.locator('#imjasMonthFilter option')).toHaveCount(8);
  await expect(page.locator('#businessHeading')).toContainText('Januari 2027 MTD');
  liveBalance = 2;
  await page.clock.fastForward(120000);
  expect(syncRequests).toBe(1);
  await expect(page.locator('#cards .card').first().locator('.value')).toHaveText('1');
  await page.reload();
  await expect.poll(() => syncRequests).toBe(2);
  await expect(page.locator('#cards .card').first().locator('.value')).toHaveText('2');
  expect(errors).toEqual([]);
});
