import { BaseInvoiceProvider, ProviderConfig } from "./base-provider";
import { MockInvoiceProvider } from "./mock-provider";
import { IsnetProvider } from "./isnet-provider";

export type ProviderName = "mock" | "isnet";

export function createProvider(
  name: ProviderName,
  config?: Partial<ProviderConfig>
): BaseInvoiceProvider {
  switch (name) {
    case "mock":
      return new MockInvoiceProvider(config);
    case "isnet":
      if (!config?.baseUrl || !config?.username || !config?.password) {
        throw new Error("İşNet provider requires baseUrl, username, and password.");
      }
      return new IsnetProvider(config as ProviderConfig);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
