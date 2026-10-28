/**
 * NexBill Enterprise Data Backup & Disaster Recovery Service
 * Supports 1-Click JSON System Snapshot and Restore for Invoices, CRM Customers,
 * Multi-Firms, Books Daybook, Custom Products, Bank Details, and Digital Signatures.
 */

export interface BackupPayload {
  version: string;
  appName: string;
  exportedAt: string;
  data: {
    invoices: any[];
    savedCustomers: any[];
    firms: any[];
    activeFirm: any;
    terms: any;
    bank: any;
    customProducts: any[];
    daybookEntries: any[];
    accountingEntries: any[];
    signature?: string;
    stamp?: string;
    logo?: string;
    businessVertical?: string;
  };
  summary: {
    totalInvoices: number;
    totalCustomers: number;
    totalFirms: number;
    totalDaybookEntries: number;
  };
}

export const backupService = {
  /**
   * Export all user data into a portable JSON backup file.
   */
  exportFullBackup(): BackupPayload {
    const invoices = this.getJson('nb_invoices_history', []);
    // Harmonized customer directory
    const savedCustomers = this.getJson('nb_customer_directory', this.getJson('nb_saved_customers_list', []));
    const firms = this.getJson('nb_firms_list', []);
    const activeFirm = this.getJson('nb_firm_data', {});
    const terms = this.getJson('nb_terms_data', {});
    // Harmonized bank details
    const bank = this.getJson('nb_bank_data', this.getJson('nb_bank_details', {}));
    // Harmonized stock/products library
    const customProducts = this.getJson('nb_stocks_library', this.getJson('nb_custom_products', []));
    // Harmonized book/daybook entries
    const daybookEntries = this.getJson('nb_book_entries', this.getJson('nb_daybook_entries', []));
    const accountingEntries = this.getJson('nb_accounting_entries', []);
    const signature = localStorage.getItem('nb_saved_signature') || '';
    const stamp = localStorage.getItem('nb_saved_stamp') || '';
    const logo = localStorage.getItem('nb_saved_logo') || '';
    const businessVertical = localStorage.getItem('nb_selected_trade') || localStorage.getItem('nb_industry') || 'solar';

    const payload: BackupPayload = {
      version: '3.0',
      appName: 'NexBill Pro SaaS',
      exportedAt: new Date().toISOString(),
      data: {
        invoices,
        savedCustomers,
        firms,
        activeFirm,
        terms,
        bank,
        customProducts,
        daybookEntries,
        accountingEntries,
        signature,
        stamp,
        logo,
        businessVertical,
      },
      summary: {
        totalInvoices: invoices.length,
        totalCustomers: savedCustomers.length,
        totalFirms: firms.length,
        totalDaybookEntries: daybookEntries.length,
      },
    };

    // Trigger file download
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nexbill_full_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return payload;
  },

  /**
   * Restore all system data from a user-supplied JSON backup file.
   */
  async restoreBackupFromFile(file: File): Promise<{
    success: boolean;
    message: string;
    summary?: BackupPayload['summary'];
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = e.target?.result as string;
          const parsed = JSON.parse(raw);

          // Support standard NexBill backup format
          const d = parsed.data || parsed;

          // Schema validation: ensure object is a valid backup
          if (!d || typeof d !== 'object') {
            resolve({
              success: false,
              message: 'Invalid backup file structure: missing data payload.',
            });
            return;
          }

          // Pre-restore recovery safety snapshot
          try {
            const preRestoreSnapshot = {
              timestamp: new Date().toISOString(),
              invoices: localStorage.getItem('nb_invoices_history'),
              customers: localStorage.getItem('nb_customer_directory'),
              firms: localStorage.getItem('nb_firms_list'),
              firm: localStorage.getItem('nb_firm_data'),
              bank: localStorage.getItem('nb_bank_data'),
              books: localStorage.getItem('nb_book_entries'),
            };
            localStorage.setItem('nb_pre_restore_backup', JSON.stringify(preRestoreSnapshot));
          } catch {}

          let invoicesCount = 0;
          let customersCount = 0;
          let daybookCount = 0;

          if (d.invoices && Array.isArray(d.invoices)) {
            localStorage.setItem('nb_invoices_history', JSON.stringify(d.invoices));
            invoicesCount = d.invoices.length;
          } else if (parsed.nb_invoices_history) {
            localStorage.setItem('nb_invoices_history', parsed.nb_invoices_history);
          }

          const customerData = d.savedCustomers || d.customers || d.nb_customer_directory;
          if (customerData && Array.isArray(customerData)) {
            localStorage.setItem('nb_customer_directory', JSON.stringify(customerData));
            localStorage.setItem('nb_saved_customers_list', JSON.stringify(customerData));
            customersCount = customerData.length;
          }

          if (d.firms && Array.isArray(d.firms)) {
            localStorage.setItem('nb_firms_list', JSON.stringify(d.firms));
          }

          if (d.activeFirm && typeof d.activeFirm === 'object') {
            localStorage.setItem('nb_firm_data', JSON.stringify(d.activeFirm));
          }

          if (d.terms && typeof d.terms === 'object') {
            localStorage.setItem('nb_terms_data', JSON.stringify(d.terms));
          }

          const bankData = d.bank || d.bankDetails;
          if (bankData && typeof bankData === 'object') {
            localStorage.setItem('nb_bank_data', JSON.stringify(bankData));
            localStorage.setItem('nb_bank_details', JSON.stringify(bankData));
          }

          const productData = d.customProducts || d.stocks || d.stockLibrary;
          if (productData && Array.isArray(productData)) {
            localStorage.setItem('nb_stocks_library', JSON.stringify(productData));
            localStorage.setItem('nb_custom_products', JSON.stringify(productData));
          }

          const daybookData = d.daybookEntries || d.bookEntries || d.accounting;
          if (daybookData && Array.isArray(daybookData)) {
            localStorage.setItem('nb_book_entries', JSON.stringify(daybookData));
            localStorage.setItem('nb_daybook_entries', JSON.stringify(daybookData));
            daybookCount = daybookData.length;
          }

          if (d.accountingEntries && Array.isArray(d.accountingEntries)) {
            localStorage.setItem('nb_accounting_entries', JSON.stringify(d.accountingEntries));
          }

          if (d.signature) {
            localStorage.setItem('nb_saved_signature', d.signature);
          }

          if (d.stamp) {
            localStorage.setItem('nb_saved_stamp', d.stamp);
          }

          if (d.logo) {
            localStorage.setItem('nb_saved_logo', d.logo);
          }

          if (d.businessVertical || d.trade) {
            const tr = d.businessVertical || d.trade;
            localStorage.setItem('nb_selected_trade', tr);
            localStorage.setItem('nb_industry', tr);
            localStorage.setItem('nb_business_vertical', tr);
          }

          resolve({
            success: true,
            message: `Restore complete! Successfully imported ${invoicesCount} invoices, ${customersCount} customers, and ${daybookCount} daybook records. Recovery snapshot saved.`,
            summary: {
              totalInvoices: invoicesCount,
              totalCustomers: customersCount,
              totalFirms: (d.firms || []).length,
              totalDaybookEntries: daybookCount,
            },
          });
        } catch (err: any) {
          resolve({
            success: false,
            message: `Failed to restore: Invalid JSON structure or corrupted backup file (${err?.message || 'Parse error'}).`,
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Error reading selected backup file.',
        });
      };

      reader.readAsText(file);
    });
  },

  /**
   * Export all invoices as standard Excel-compatible CSV.
   */
  exportInvoicesToCSV(): void {
    const invoices = this.getJson('nb_invoices_history', []);
    if (!invoices.length) {
      alert('No saved invoices found to export.');
      return;
    }

    const headers = [
      'Invoice No',
      'Date',
      'Doc Type',
      'Customer Name',
      'Mobile',
      'Aadhaar (Masked)',
      'GSTIN',
      'Capacity (KW)',
      'Taxable Amount (Rs)',
      'CGST (Rs)',
      'SGST (Rs)',
      'Total GST (Rs)',
      'Grand Total (Rs)',
      'Firm Name',
    ];

    const rows = invoices.map((inv: any) => [
      `"${inv.invNo || ''}"`,
      `"${inv.date || ''}"`,
      `"${inv.docType || 'invoice'}"`,
      `"${(inv.customerName || '').replace(/"/g, '""')}"`,
      `"${inv.customerMobile || ''}"`,
      `"${(inv.customerSnapshot?.aadhar || '').replace(/\d(?=\d{4})/g, 'X')}"`,
      `"${inv.customerGstin || ''}"`,
      `"${inv.plantCapacityKw || ''}"`,
      (inv.taxableAmount || 0).toFixed(2),
      (inv.cgstAmount || 0).toFixed(2),
      (inv.sgstAmount || 0).toFixed(2),
      ((inv.cgstAmount || 0) + (inv.sgstAmount || 0)).toFixed(2),
      (inv.grandTotal || 0).toFixed(2),
      `"${(inv.firmName || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexbill_invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getJson(key: string, fallback: any) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
};
