export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64Data?: string;
  url?: string; // Kept for backward compatibility with old base64 data
  savedFileName?: string; // New: reference to the physical file in database directory
}

export interface DagInfo {
  id: string;
  hasCS: boolean;
  csDag?: string;
  hasSA: boolean;
  saDag?: string;
  hasRS: boolean;
  rsDag?: string;
  landClass?: string; // জমির শ্রেণী
  totalAmount: number; // দাগের মোট জমি (শতক)
  namjariAmount?: number; // নামজারীকৃত পরিমান (শতক)
  kateAmount?: number; // কাতে পরিমান (শতক)
  amount: number; // ক্রয়কৃত / বিক্রয়কৃত পরিমাণ (শতক)
}

export interface KhatianInfo {
  id: string;
  hasCS: boolean;
  csKhatian?: string;
  hasSA: boolean;
  saKhatian?: string;
  hasRS: boolean;
  rsKhatian?: string;
  hasNamjari: boolean;
  namjariKhatian?: string;
  dags: DagInfo[];
}

export interface LandTransaction {
  id: string;
  type: 'purchase' | 'sale';
  deedNumber: string;
  deedNature?: string;
  date: string;
  mouza: string;
  buyerName: string;
  sellerName: string;
  totalLandAmount: number;
  namjariLandAmount: number;
  transactionAmount: number;
  khatians: KhatianInfo[];
  attachments: Attachment[];
  notes?: string;
}

export interface MouzaStats {
  mouza: string;
  totalPurchase: number;
  totalSale: number;
  remaining: number;
  deedsCount: number;
  totalRSKhatian: number;
  totalNamjariKhatian: number;
  totalRSDag: number;
}

export interface KhatianStats {
  khatianType: 'CS' | 'SA' | 'RS' | 'Namjari';
  khatianNo: string;
  mouza: string;
  purchasedAmount: number;
  soldAmount: number;
  remainingAmount: number;
  dags: {
    dagType: string;
    dagNo: string;
    purchased: number;
    sold: number;
    remaining: number;
  }[];
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string; // for easier rendering
  additionalCustomers?: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  amount: number;
  type: 'Purchase' | 'Sale' | 'Other';
  khatians: KhatianInfo[];
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalTransactions: number;
  status: 'Active' | 'Inactive';
}
