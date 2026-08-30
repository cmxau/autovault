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
