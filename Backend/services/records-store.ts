export interface PersistentDriverLog {
  id: string | number;
  totalDistance: number;
  mileageStart: number;
  mileageEnd: number;
  imgStartUrl?: string | null;
  imgEndUrl?: string | null;
  createdAt?: string;
  booking?: {
    destination?: string;
    departureDate: string | Date;
    objective?: string;
  };
  driver?: {
    user?: {
      name?: string;
    };
    assignedVan?: {
      plate?: string;
    };
  };
}

export interface PersistentExpense {
  id: string | number;
  category?: string;
  type?: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remark?: string;
  receiptUrl?: string | null;
  createdAt: string;
  driverLog?: {
    driver?: {
      user?: {
        name?: string;
      };
      assignedVan?: {
        plate?: string;
      };
    };
    booking?: {
      destination?: string;
    };
  };
}

// Initial store starts EMPTY (No mock data)
let storedDriverLogs: PersistentDriverLog[] = [];

// Initial store starts EMPTY (No mock data)
let storedExpenses: PersistentExpense[] = [];

export function getStoredDriverLogs(): PersistentDriverLog[] {
  return storedDriverLogs;
}

export function addStoredDriverLog(newLog: Partial<PersistentDriverLog>): PersistentDriverLog {
  const created: PersistentDriverLog = {
    id: Date.now(),
    totalDistance: Number(newLog.totalDistance || 0),
    mileageStart: Number(newLog.mileageStart || 0),
    mileageEnd: Number(newLog.mileageEnd || 0),
    imgStartUrl: newLog.imgStartUrl || null,
    imgEndUrl: newLog.imgEndUrl || null,
    createdAt: new Date().toISOString(),
    booking: {
      destination: newLog.booking?.destination || "ไม่ระบุสถานที่",
      departureDate: newLog.booking?.departureDate || new Date().toISOString(),
      objective: newLog.booking?.objective || "การเดินทางและภารกิจคณะ"
    },
    driver: {
      user: { name: newLog.driver?.user?.name || "ไม่ระบุชื่อ" },
      assignedVan: { plate: newLog.driver?.assignedVan?.plate || "ไม่ระบุทะเบียน" }
    }
  };

  storedDriverLogs.unshift(created);
  return created;
}

export function deleteStoredDriverLog(id: string | number): boolean {
  storedDriverLogs = storedDriverLogs.filter(l => String(l.id) !== String(id));
  return true;
}

export function getStoredExpenses(): PersistentExpense[] {
  return storedExpenses;
}

export function addStoredExpense(newExp: Partial<PersistentExpense>): PersistentExpense {
  const created: PersistentExpense = {
    id: Date.now(),
    type: newExp.type || newExp.category || "ค่าใช้จ่ายทั่วไป",
    category: newExp.category || newExp.type || "ค่าใช้จ่ายทั่วไป",
    amount: Number(newExp.amount || 0),
    status: newExp.status || "PENDING",
    remark: newExp.remark || "",
    receiptUrl: newExp.receiptUrl || null,
    createdAt: new Date().toISOString(),
    driverLog: {
      driver: {
        user: { name: newExp.driverLog?.driver?.user?.name || "ไม่ระบุชื่อ" },
        assignedVan: { plate: newExp.driverLog?.driver?.assignedVan?.plate || "ไม่ระบุทะเบียน" }
      },
      booking: {
        destination: newExp.driverLog?.booking?.destination || "ไม่ระบุสถานที่"
      }
    }
  };

  storedExpenses.unshift(created);
  return created;
}

export function updateStoredExpenseStatus(id: string | number, status: 'PENDING' | 'APPROVED' | 'REJECTED'): PersistentExpense | null {
  const item = storedExpenses.find(e => String(e.id) === String(id));
  if (item) {
    item.status = status;
    return item;
  }
  return null;
}

export function deleteStoredExpense(id: string | number): boolean {
  storedExpenses = storedExpenses.filter(e => String(e.id) !== String(id));
  return true;
}
