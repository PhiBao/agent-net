import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

// Use custom issuer if set (for fully automated demo), otherwise Circle testnet USDC
let USDC_ISSUER =
  process.env.USDC_ISSUER ||
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const horizon = new Horizon.Server(HORIZON_URL);

export function setUSDCIssuer(issuer: string) {
  USDC_ISSUER = issuer;
}

export function getUSDCIssuer(): string {
  return USDC_ISSUER;
}

export function generateKeypair() {
  const kp = Keypair.random();
  return {
    publicKey: kp.publicKey(),
    secretKey: kp.secret(),
  };
}

export async function fundTestnetAccount(
  publicKey: string,
  retries = 3
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (response.ok) return true;
      // Account may already be funded
      const body = await response.text();
      if (body.includes("createAccountAlreadyExist")) return true;
    } catch {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
      }
    }
  }
  return false;
}

export async function setupUSDCTrustline(
  secretKey: string,
  issuer?: string
): Promise<boolean> {
  try {
    const kp = Keypair.fromSecret(secretKey);
    const account = await horizon.loadAccount(kp.publicKey());
    const usdc = new Asset("USDC", issuer || USDC_ISSUER);

    // Check if trustline already exists
    const hasTrustline = account.balances.some(
      (b) =>
        "asset_code" in b &&
        b.asset_code === "USDC" &&
        "asset_issuer" in b &&
        b.asset_issuer === (issuer || USDC_ISSUER)
    );
    if (hasTrustline) return true;

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(Operation.changeTrust({ asset: usdc }))
      .setTimeout(30)
      .build();

    tx.sign(kp);
    await horizon.submitTransaction(tx);
    return true;
  } catch (err) {
    console.error("Trustline setup failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function getBalance(
  publicKey: string
): Promise<{ xlm: string; usdc: string }> {
  try {
    const account = await horizon.loadAccount(publicKey);
    let xlm = "0";
    let usdc = "0";

    for (const balance of account.balances) {
      if (balance.asset_type === "native") {
        xlm = balance.balance;
      } else if (
        "asset_code" in balance &&
        balance.asset_code === "USDC" &&
        "asset_issuer" in balance &&
        balance.asset_issuer === USDC_ISSUER
      ) {
        usdc = balance.balance;
      }
    }

    return { xlm, usdc };
  } catch {
    return { xlm: "0", usdc: "0" };
  }
}

export async function sendUSDC(
  senderSecret: string,
  destinationPublicKey: string,
  amount: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const senderKeypair = Keypair.fromSecret(senderSecret);
    const account = await horizon.loadAccount(senderKeypair.publicKey());
    const usdc = new Asset("USDC", USDC_ISSUER);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: usdc,
          amount: amount,
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(senderKeypair);
    const result = await horizon.submitTransaction(tx);
    return { success: true, txHash: result.hash };
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    // Extract Stellar horizon error details
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (err as Record<string, unknown>).response === "object"
    ) {
      const resp = (err as { response: { data?: { extras?: { result_codes?: unknown } } } })
        .response;
      if (resp.data?.extras?.result_codes) {
        message += ` | Codes: ${JSON.stringify(resp.data.extras.result_codes)}`;
      }
    }
    return { success: false, error: message };
  }
}

/**
 * Issue USDC from an issuer account to a destination.
 * The issuer must be the issuing authority for the USDC asset.
 */
export async function issueUSDC(
  issuerSecret: string,
  destinationPublicKey: string,
  amount: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const issuerKeypair = Keypair.fromSecret(issuerSecret);
    const account = await horizon.loadAccount(issuerKeypair.publicKey());
    const usdc = new Asset("USDC", issuerKeypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: usdc,
          amount: amount,
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(issuerKeypair);
    const result = await horizon.submitTransaction(tx);
    return { success: true, txHash: result.hash };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function createAndFundAgent(issuerOverride?: string): Promise<{
  publicKey: string;
  secretKey: string;
  funded: boolean;
  trustline: boolean;
}> {
  const { publicKey, secretKey } = generateKeypair();
  const funded = await fundTestnetAccount(publicKey);
  let trustline = false;
  if (funded) {
    trustline = await setupUSDCTrustline(secretKey, issuerOverride);
  }
  return { publicKey, secretKey, funded, trustline };
}

export function getStellarExplorerUrl(publicKeyOrHash?: string): string {
  if (!publicKeyOrHash) return "https://stellar.expert/explorer/testnet";
  return `https://stellar.expert/explorer/testnet/account/${publicKeyOrHash}`;
}

export function getStellarTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
