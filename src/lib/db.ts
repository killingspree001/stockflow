import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getAuthClient, getDbClient } from "./firebase";
import type {
  CartItem,
  Product,
  ProductInput,
  Profile,
  Role,
  Sale,
  SaleItem,
} from "./types";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

// --- Profiles -------------------------------------------------------------

export async function createProfile(
  uid: string,
  email: string,
  fullName: string
) {
  const db = getDbClient();
  await setDoc(doc(db, "users", uid), {
    email,
    full_name: fullName,
    role: "owner" satisfies Role,
    createdAt: serverTimestamp(),
  });
}

export function profileFromSnapshot(
  uid: string,
  data: Record<string, unknown> | undefined,
  fallbackEmail: string | null
): Profile {
  return {
    id: uid,
    email: (data?.email as string) ?? fallbackEmail,
    full_name: (data?.full_name as string) ?? null,
    role: (data?.role as Role) ?? "cashier",
  };
}

// --- Products -------------------------------------------------------------

export async function listProducts(): Promise<Product[]> {
  const db = getDbClient();
  const snap = await getDocs(query(collection(db, "products"), orderBy("name")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      sku: data.sku ?? null,
      barcode: data.barcode ?? null,
      category: data.category ?? null,
      cost_price: Number(data.cost_price) || 0,
      sell_price: Number(data.sell_price) || 0,
      quantity: Number(data.quantity) || 0,
      reorder_level: Number(data.reorder_level) || 0,
      createdAt: toMillis(data.createdAt),
      updatedAt: toMillis(data.updatedAt),
    };
  });
}

export async function addProduct(input: ProductInput) {
  const db = getDbClient();
  await addDoc(collection(db, "products"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  const db = getDbClient();
  await updateDoc(doc(db, "products", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string) {
  const db = getDbClient();
  await deleteDoc(doc(db, "products", id));
}

export async function importProducts(rows: ProductInput[]) {
  const db = getDbClient();
  const batch = writeBatch(db);
  for (const row of rows) {
    batch.set(doc(collection(db, "products")), {
      ...row,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

// --- Sales ----------------------------------------------------------------

export async function listSalesSince(sinceMillis: number): Promise<Sale[]> {
  const db = getDbClient();
  const snap = await getDocs(
    query(
      collection(db, "sales"),
      where("createdAt", ">=", Timestamp.fromMillis(sinceMillis)),
      orderBy("createdAt")
    )
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      cashierId: data.cashierId ?? null,
      total: Number(data.total) || 0,
      cost_total: Number(data.cost_total) || 0,
      profit: Number(data.profit) || 0,
      item_count: Number(data.item_count) || 0,
      items: (data.items ?? []) as SaleItem[],
      createdAt: toMillis(data.createdAt),
    };
  });
}

// Ring up a sale. The whole thing runs inside one Firestore transaction:
// every product is read and checked first, and only if all of them have enough
// stock are the quantities decremented and the sale written. If two tills hit
// the same product at once, Firestore retries the loser, so stock can't go
// negative.
export async function checkout(cart: CartItem[]): Promise<string> {
  if (cart.length === 0) throw new Error("The cart is empty");

  const db = getDbClient();
  const cashierId = getAuthClient().currentUser?.uid ?? null;
  const saleRef = doc(collection(db, "sales"));

  await runTransaction(db, async (tx) => {
    const refs = cart.map((line) => doc(db, "products", line.product_id));
    const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));

    let total = 0;
    let costTotal = 0;
    let count = 0;
    const items: SaleItem[] = [];

    snaps.forEach((snap, i) => {
      if (!snap.exists()) throw new Error("A product no longer exists");
      const data = snap.data();
      const want = cart[i].quantity;

      if (want <= 0) throw new Error("Quantity must be greater than zero");
      if (data.quantity < want) {
        throw new Error(`Only ${data.quantity} left of ${data.name}`);
      }

      const lineTotal = Number(data.sell_price) * want;
      total += lineTotal;
      costTotal += Number(data.cost_price) * want;
      count += want;

      items.push({
        product_id: snap.id,
        name: data.name,
        unit_price: Number(data.sell_price),
        unit_cost: Number(data.cost_price),
        quantity: want,
        line_total: lineTotal,
      });
    });

    snaps.forEach((snap, i) => {
      tx.update(refs[i], {
        quantity: Number(snap.data()!.quantity) - cart[i].quantity,
        updatedAt: serverTimestamp(),
      });
    });

    tx.set(saleRef, {
      cashierId,
      total,
      cost_total: costTotal,
      profit: total - costTotal,
      item_count: count,
      items,
      createdAt: serverTimestamp(),
    });
  });

  return saleRef.id;
}
