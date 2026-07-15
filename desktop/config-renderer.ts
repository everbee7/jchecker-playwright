export {};

declare global {
  interface Window {
    jobChecker: {
      saveMongoUri(uri: string): Promise<{ ok: boolean; error?: string }>;
    };
  }
}

const form = document.querySelector<HTMLFormElement>("#mongo-form");
const input = document.querySelector<HTMLInputElement>("#mongo-uri");
const button = document.querySelector<HTMLButtonElement>("#save-button");
const error = document.querySelector<HTMLParagraphElement>("#error");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!input || !button || !error) return;
  button.disabled = true;
  button.textContent = "Connecting…";
  error.textContent = "";
  const result = await window.jobChecker.saveMongoUri(input.value.trim());
  if (!result.ok) {
    error.textContent =
      result.error ?? "Could not save the MongoDB connection.";
    button.disabled = false;
    button.textContent = "Save and open JobChecker";
  }
});
