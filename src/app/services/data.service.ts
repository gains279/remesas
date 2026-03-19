import { Injectable, signal, computed, effect } from '@angular/core';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { db, auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export interface CurrencyPair {
  id: string;
  base: string;
  quote: string;
  rate: number;
  isFavorite?: boolean;
  history: { date: string; rate: number }[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'REMITTANCE_IN' | 'REMITTANCE_OUT';
  currency: string;
  amount: number;
  description: string;
}

export interface Remittance {
  id: string;
  date: string;
  senderFirstName: string;
  senderLastName: string;
  agentName: string;
  pairId: string;
  amountSent: number;
  amountReceived: number;
  rate: number;
  profitInBase?: number;
}

export interface Exchange {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  amountSold: number;
  amountReceived: number;
  rate: number;
  costRate?: number;
  profit?: number;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  user = signal<User | null>(null);
  isAuthReady = signal(false);

  pairs = signal<CurrencyPair[]>([]);
  currencies = signal<string[]>([
    'USD', 'EUR', 'MXN', 'GBP', 'CAD', 'JPY', 'AUD', 'CHF', 'CNY', 'COP', 'ARS', 'BRL', 'CLP', 'PEN'
  ]);
  transactions = signal<Transaction[]>([]);
  remittances = signal<Remittance[]>([]);
  exchanges = signal<Exchange[]>([]);

  balances = computed(() => {
    const bals: Record<string, number> = {};
    for (const p of this.pairs()) {
      if (bals[p.base] === undefined) bals[p.base] = 0;
      if (bals[p.quote] === undefined) bals[p.quote] = 0;
    }
    for (const t of this.transactions()) {
      if (bals[t.currency] === undefined) bals[t.currency] = 0;
      bals[t.currency] += t.amount;
    }
    return bals;
  });

  constructor() {
    onAuthStateChanged(auth, (user: User | null) => {
      this.user.set(user);
      this.isAuthReady.set(true);
    });

    effect(() => {
      const user = this.user();
      if (user) {
        this.setupListeners(user.uid);
        this.testConnection();
      } else {
        this.resetData();
      }
    });
  }

  private handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map((provider: any) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  private async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }

  private setupListeners(uid: string) {
    // Pairs
    const pairsPath = `users/${uid}/pairs`;
    onSnapshot(collection(db, pairsPath), (snapshot: any) => {
      this.pairs.set(snapshot.docs.map((d: any) => d.data() as CurrencyPair));
    }, (error: any) => this.handleFirestoreError(error, OperationType.GET, pairsPath));

    // Transactions
    const txPath = `users/${uid}/transactions`;
    onSnapshot(query(collection(db, txPath), orderBy('date', 'desc')), (snapshot: any) => {
      this.transactions.set(snapshot.docs.map((d: any) => d.data() as Transaction));
    }, (error: any) => this.handleFirestoreError(error, OperationType.GET, txPath));

    // Remittances
    const remPath = `users/${uid}/remittances`;
    onSnapshot(query(collection(db, remPath), orderBy('date', 'desc')), (snapshot: any) => {
      this.remittances.set(snapshot.docs.map((d: any) => d.data() as Remittance));
    }, (error: any) => this.handleFirestoreError(error, OperationType.GET, remPath));

    // Exchanges
    const exPath = `users/${uid}/exchanges`;
    onSnapshot(query(collection(db, exPath), orderBy('date', 'desc')), (snapshot: any) => {
      this.exchanges.set(snapshot.docs.map((d: any) => d.data() as Exchange));
    }, (error: any) => this.handleFirestoreError(error, OperationType.GET, exPath));

    // Config
    const configPath = `users/${uid}/config/main`;
    onSnapshot(doc(db, configPath), (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data['currencies']) this.currencies.set(data['currencies']);
      }
    }, (error: any) => this.handleFirestoreError(error, OperationType.GET, configPath));
  }

  async login() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error('Login error', error);
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error', error);
    }
  }

  getRate(from: string, to: string): number | null {
    if (from === to) return 1;
    const pairs = this.pairs();
    
    let pair = pairs.find(p => p.base === from && p.quote === to);
    if (pair) return pair.rate;
    pair = pairs.find(p => p.quote === from && p.base === to);
    if (pair) return 1 / pair.rate;

    for (const p1 of pairs) {
      const intermediate = p1.base === from ? p1.quote : (p1.quote === from ? p1.base : null);
      if (intermediate) {
        const rate1 = p1.base === from ? p1.rate : 1 / p1.rate;
        
        let p2 = pairs.find(p => p.base === intermediate && p.quote === to);
        if (p2) return rate1 * p2.rate;
        p2 = pairs.find(p => p.quote === intermediate && p.base === to);
        if (p2) return rate1 * (1 / p2.rate);
      }
    }
    
    return null;
  }

  async addPair(base: string, quote: string, rate: number) {
    const user = this.user();
    if (!user) return;
    const id = `${base}-${quote}`;
    const path = `users/${user.uid}/pairs/${id}`;
    const pair: CurrencyPair = { id, base, quote, rate, isFavorite: false, history: [{ date: new Date().toISOString(), rate }] };
    try {
      await setDoc(doc(db, path), pair);
    } catch (error) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async toggleFavoritePair(id: string) {
    const user = this.user();
    if (!user) return;
    const pair = this.pairs().find(p => p.id === id);
    if (!pair) return;
    const path = `users/${user.uid}/pairs/${id}`;
    try {
      await setDoc(doc(db, path), { ...pair, isFavorite: !pair.isFavorite });
    } catch (error) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async addCurrency(code: string) {
    const user = this.user();
    if (!user) return;
    const upperCode = code.toUpperCase().trim();
    if (upperCode && !this.currencies().includes(upperCode)) {
      const newCurrencies = [...this.currencies(), upperCode].sort();
      const path = `users/${user.uid}/config/main`;
      try {
        await setDoc(doc(db, path), { currencies: newCurrencies });
      } catch (error) {
        this.handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  }

  async removeCurrency(code: string) {
    const user = this.user();
    if (!user) return;
    const newCurrencies = this.currencies().filter(x => x !== code);
    const path = `users/${user.uid}/config/main`;
    try {
      await setDoc(doc(db, path), { currencies: newCurrencies });
    } catch (error) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateRate(id: string, newRate: number) {
    const user = this.user();
    if (!user) return;
    const pair = this.pairs().find(p => p.id === id);
    if (!pair) return;
    const path = `users/${user.uid}/pairs/${id}`;
    try {
      await setDoc(doc(db, path), { 
        ...pair, 
        rate: newRate, 
        history: [...pair.history, { date: new Date().toISOString(), rate: newRate }] 
      });
    } catch (error) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deletePair(id: string) {
    const user = this.user();
    if (!user) return;
    const path = `users/${user.uid}/pairs/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      this.handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async addTransaction(type: Transaction['type'], currency: string, amount: number, description: string) {
    const user = this.user();
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const path = `users/${user.uid}/transactions/${id}`;
    const t: Transaction = {
      id,
      date: new Date().toISOString(),
      type,
      currency,
      amount,
      description
    };
    try {
      await setDoc(doc(db, path), t);
    } catch (error) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async addRemittance(rem: Omit<Remittance, 'id' | 'date' | 'profitInBase'>) {
    const user = this.user();
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const date = new Date().toISOString();
    
    const [base, quote] = rem.pairId.split('-');
    const marketRate = this.getRate(base, quote);
    let profitInBase = 0;
    if (marketRate !== null) {
      profitInBase = rem.amountSent - (rem.amountReceived / marketRate);
    }

    const newRem: Remittance = { ...rem, id, date, profitInBase };
    const path = `users/${user.uid}/remittances/${id}`;
    
    try {
      await setDoc(doc(db, path), newRem);
      
      const pair = this.pairs().find(p => p.id === rem.pairId);
      if (pair) {
        await this.addTransaction('REMITTANCE_IN', pair.base, rem.amountSent, `Remesa de ${rem.senderFirstName} ${rem.senderLastName}`);
        await this.addTransaction('REMITTANCE_OUT', pair.quote, -rem.amountReceived, `Pago de remesa ${rem.senderFirstName} ${rem.senderLastName}`);
      }
    } catch (error) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async addExchange(fromCurrency: string, toCurrency: string, amountSold: number, rate: number, costRate: number) {
    const user = this.user();
    if (!user) return;
    const id = Math.random().toString(36).substring(2, 9);
    const date = new Date().toISOString();
    const amountReceived = amountSold * rate;
    const profit = amountSold * (rate - costRate);

    const newExchange: Exchange = { id, date, fromCurrency, toCurrency, amountSold, amountReceived, rate, costRate, profit };
    const path = `users/${user.uid}/exchanges/${id}`;
    
    try {
      await setDoc(doc(db, path), newExchange);
      await this.addTransaction('WITHDRAWAL', fromCurrency, -amountSold, `Intercambio a ${toCurrency} (Tasa: ${rate})`);
      await this.addTransaction('DEPOSIT', toCurrency, amountReceived, `Intercambio desde ${fromCurrency} (Tasa: ${rate})`);
    } catch (error) {
      this.handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  exportData() {
    const data = {
      pairs: this.pairs(),
      transactions: this.transactions(),
      remittances: this.remittances(),
      exchanges: this.exchanges(),
      currencies: this.currencies()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async importData(json: string): Promise<boolean> {
    const user = this.user();
    if (!user) return false;

    try {
      const data = JSON.parse(json);
      const uid = user.uid;

      // Import Currencies
      if (data.currencies) {
        await setDoc(doc(db, `users/${uid}/config/main`), { currencies: data.currencies });
      }

      // Import Pairs
      if (data.pairs) {
        for (const pair of data.pairs) {
          await setDoc(doc(db, `users/${uid}/pairs/${pair.id}`), pair);
        }
      }

      // Import Transactions
      if (data.transactions) {
        for (const tx of data.transactions) {
          await setDoc(doc(db, `users/${uid}/transactions/${tx.id}`), tx);
        }
      }

      // Import Remittances
      if (data.remittances) {
        for (const rem of data.remittances) {
          await setDoc(doc(db, `users/${uid}/remittances/${rem.id}`), rem);
        }
      }

      // Import Exchanges
      if (data.exchanges) {
        for (const ex of data.exchanges) {
          await setDoc(doc(db, `users/${uid}/exchanges/${ex.id}`), ex);
        }
      }

      return true;
    } catch (error) {
      console.error('Import error', error);
      return false;
    }
  }

  async resetData() {
    const user = this.user();
    if (!user) return;
    const uid = user.uid;

    try {
      // We can't easily delete collections in Firestore from the client without a cloud function or deleting each doc.
      // For this app, we'll delete the documents we know about.
      
      const deletePromises: Promise<void>[] = [];

      this.pairs().forEach(p => deletePromises.push(deleteDoc(doc(db, `users/${uid}/pairs/${p.id}`))));
      this.transactions().forEach(t => deletePromises.push(deleteDoc(doc(db, `users/${uid}/transactions/${t.id}`))));
      this.remittances().forEach(r => deletePromises.push(deleteDoc(doc(db, `users/${uid}/remittances/${r.id}`))));
      this.exchanges().forEach(e => deletePromises.push(deleteDoc(doc(db, `users/${uid}/exchanges/${e.id}`))));

      await Promise.all(deletePromises);
      
      // Also reset currencies to default
      await setDoc(doc(db, `users/${uid}/config/main`), { currencies: ['USD', 'VES', 'COP', 'BRL'] });

    } catch (error) {
      console.error('Reset error', error);
    }
  }
}
