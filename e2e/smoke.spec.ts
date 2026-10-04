import { test, expect, type Page } from "@playwright/test";

// Each Playwright test gets a fresh browser context, so localStorage already
// starts empty per test, matching AutoVault's local-first, no-account design.

async function completeOnboarding(page: Page, name = "Test User") {
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome/);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Your name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create My Garage" }).click();
  await expect(page).toHaveURL(/\/vehicle\/new/);
}

async function addVehicle(
  page: Page,
  {
    make = "Honda",
    model = "City",
    year = "2023",
    registration = "MH 12 AB 1234",
    odometer = "24820",
    nickname = "Daily Driver",
  } = {},
) {
  // Step 0: kind (Car is preselected)
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 1: make/model/variant/year
  await page.getByLabel("Make").fill(make);
  await page.getByLabel("Model").fill(model);
  await page.getByLabel("Year").fill(year);
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 2: registration
  await page.getByLabel("Number").fill(registration);
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 3: odometer
  await page.getByLabel("Odometer", { exact: false }).first().fill(odometer);
  await page.getByRole("button", { name: "Continue" }).click();
  // Step 4: nickname
  await page.getByLabel("Nickname").fill(nickname);
  await page.getByRole("button", { name: "Add to My Garage" }).click();
  await expect(page).toHaveURL(/\/vehicle\/[a-f0-9-]+$/);
}

test("onboarding through first vehicle creation", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);
  await expect(page.getByText("Daily Driver")).toBeVisible();
});

test("edit vehicle nickname and delete vehicle", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);

  await page.goto("/");
  await expect(page.getByText("Daily Driver")).toBeVisible();

  // Manage vehicles -> detail -> edit
  await page.goto("/vehicle");
  await page.getByText("Daily Driver").click();
  await expect(page).toHaveURL(/\/vehicle\/[a-f0-9-]+$/);
  await page.getByRole("link", { name: "Edit vehicle" }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await page.getByLabel("Nickname").fill("Renamed Car");
  await page.getByRole("button", { name: "Save Changes" }).click();

  await page.goto("/");
  await expect(page.getByText("Renamed Car")).toBeVisible();

  // Delete from the edit page's Danger Zone
  await page.getByText("Renamed Car").click();
  await page.getByRole("link", { name: "Edit vehicle" }).click();
  await page.getByText("Remove vehicle").click();
  await page.getByRole("button", { name: "Remove Vehicle", exact: true }).click();
  await expect(page).toHaveURL("/");
});

test("add a fuel entry and see it in the timeline", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);

  await page.goto("/add/fuel");
  await page.getByLabel("Odometer", { exact: false }).first().fill("24900");
  await page.getByLabel("Quantity").fill("8.5");
  await page.getByLabel("Total").fill("900");
  await page.getByRole("button", { name: "Save Fuel Entry" }).click();
  await expect(page).toHaveURL(/\/timeline/);
  await expect(page.getByText("Fuel").first()).toBeVisible();
});

test("add an expense with category fields and see it in insights", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);

  await page.goto("/add/expense");
  await page.getByRole("radio", { name: "Tolls" }).click();
  await page.getByLabel("Plaza / route").fill("Mumbai-Pune Expressway");
  await page.getByLabel("Amount").fill("250");
  await page.getByRole("button", { name: "Save Expense" }).click();
  await expect(page).toHaveURL(/\/insights/);

  await page.goto("/timeline");
  await expect(page.getByText("Tolls").first()).toBeVisible();
});

test("add a service record from the expense form with a custom work item", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);

  await page.goto("/add/expense?category=Service");
  await page.getByLabel("Total cost").fill("3200");
  await page.getByRole("button", { name: "Add your own" }).click();
  await page.getByLabel("New item").fill("Clutch cable replacement");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Clutch cable replacement")).toBeVisible();
  await page.getByRole("button", { name: "Save Service Record" }).click();
  await expect(page).toHaveURL(/\/timeline/);
  await expect(page.getByText("Periodic service")).toBeVisible();
});

test("add an insurance document with type-specific fields", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);

  await page.goto("/glovebox/new");
  await page.getByRole("radio", { name: "Insurance" }).click();
  await page.getByLabel("Insurer").fill("Test Insurer");
  await page.getByLabel("Start date").fill("2026-01-01");
  await page.getByRole("button", { name: "Save Document" }).click();
  await expect(page).toHaveURL(/tab=glovebox/);
  await expect(page.getByText("Test Insurer")).toBeVisible();
});

test("global search finds a vehicle by nickname", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page, { nickname: "Searchable Scooter" });

  await page.goto("/search");
  await page.getByPlaceholder(/search vehicles/i).fill("Searchable");
  await expect(page.getByText("Searchable Scooter")).toBeVisible();
});

test("settings: distance unit toggle persists across reload", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);

  await page.goto("/settings");
  await page.getByText("Units").click();
  await page.getByText("Imperial · Miles · Gallons").click();

  await page.reload();
  await expect(page.getByText("Miles · Gallons")).toBeVisible();
});

test("backup: export produces a downloaded .autovault file", async ({ page }) => {
  await completeOnboarding(page);
  await addVehicle(page);

  await page.goto("/privacy");
  // Backups are encrypted by default; test the plain export path.
  await page.getByRole("switch", { name: "Backup Encryption" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.autovault$/);
});
