export type Language = 'en' | 'hi';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Top Nav
    'app.title': 'NexBill Pro SaaS',
    'nav.fullScreen': 'Full Screen',
    'nav.showSidebar': 'Show Side Panel',
    'nav.newBill': '+ New Bill',
    'nav.taxInvoice': 'Tax Invoice',
    'nav.quotation': 'Quotation',
    'nav.wcc': 'WCC',
    'nav.bankEstimate': 'Bank Estimate',
    'nav.marginReceipt': 'Margin Receipt',
    'nav.downloadPdf': 'Download PDF',
    'nav.print': 'Print',
    'nav.whatsApp': 'WhatsApp',
    'nav.multiFirm': 'Multi-Firm',
    'nav.crm': 'CRM & History',
    'nav.gstr1': 'GSTR-1 Export',
    'nav.books': 'Books & ITR',
    'nav.backup': 'Backup / Restore',
    'nav.branding': 'Branding',
    'nav.trade': 'Trade',
    'nav.costOn': 'Cost: ON',
    'nav.costOff': 'Cost: OFF',
    'nav.plan': 'Plan',
    
    // Document Titles & Labels
    'doc.taxInvoiceTitle': 'TAX INVOICE',
    'doc.solarQuotationTitle': 'SOLAR COMMERCIAL QUOTATION',
    'doc.quotationTitle': 'COMMERCIAL QUOTATION',
    'doc.wccTitle': 'WORK COMPLETION CERTIFICATE',
    'doc.estimateTitle': 'BANK LOAN ESTIMATE',
    'doc.marginReceiptTitle': 'MARGIN MONEY & PAYMENT RECEIPT',
    'doc.billTo': 'Billed To (Customer Details)',
    'doc.shipTo': 'Shipped To (Installation Site)',
    'doc.itemsTable': 'Goods & Services Description',
    'doc.qty': 'Qty',
    'doc.unit': 'Unit',
    'doc.rate': 'Rate',
    'doc.gst': 'GST%',
    'doc.taxable': 'Taxable Amount',
    'doc.cgst': 'CGST',
    'doc.sgst': 'SGST',
    'doc.total': 'Total',
    'doc.grandTotal': 'Grand Total',
    'doc.roundOff': 'Round Off',
    'doc.subTotal': 'Sub Total',
    'doc.amountInWords': 'Amount Chargeable (in words)',
    'doc.bankDetails': 'Bank Remittance Details',
    'doc.terms': 'Terms & Conditions',
    'doc.authSign': 'Authorized Signatory',
    'doc.customerSign': 'Customer Signature',
    
    // Receipt Specific
    'receipt.receiptNo': 'Receipt No',
    'receipt.receiptDate': 'Date',
    'receipt.dealAmount': 'Total System Deal Amount',
    'receipt.subsidy': 'Expected Direct DBT Subsidy',
    'receipt.marginDue': 'Customer Contribution (Margin Money)',
    'receipt.amountReceived': 'Amount Received Now',
    'receipt.balanceDue': 'Remaining Balance Due',
    'receipt.paymentMode': 'Payment Mode',
    'receipt.cash': 'Cash Payment',
    'receipt.upi': 'UPI / Online Transfer',
    'receipt.neft': 'Bank NEFT / RTGS / IMPS',
    'receipt.cheque': 'Cheque Payment',
    'receipt.notes': 'Payment Notes & Remarks',
  },
  hi: {
    // Top Nav
    'app.title': 'नेक्सबिल प्रो साफ़्टवेयर',
    'nav.fullScreen': 'फुल स्क्रीन',
    'nav.showSidebar': 'साइड पैनल दिखाएं',
    'nav.newBill': '+ नया बिल बनाएं',
    'nav.taxInvoice': 'टैक्स इनवॉइस (GST बिल)',
    'nav.quotation': 'कोटेशन / अनुमान',
    'nav.wcc': 'WCC सर्टिफिकेट',
    'nav.bankEstimate': 'बैंक लोन कोटेशन',
    'nav.marginReceipt': 'मार्जिन रसीद / नकद पर्ची',
    'nav.downloadPdf': 'PDF डाउनलोड',
    'nav.print': 'प्रिंट करें',
    'nav.whatsApp': 'व्हाट्सएप भेजें',
    'nav.multiFirm': 'मल्टी-फर्म',
    'nav.crm': 'ग्राहक CRM व इतिहास',
    'nav.gstr1': 'GSTR-1 रिपोर्ट',
    'nav.books': 'खाताबही व ITR',
    'nav.backup': 'बैकअप / रिस्टोर',
    'nav.branding': 'ब्रांडिंग',
    'nav.trade': 'व्यापार श्रेणी',
    'nav.costOn': 'लागत: चालू',
    'nav.costOff': 'लागत: बंद',
    'nav.plan': 'प्लान',
    
    // Document Titles & Labels
    'doc.taxInvoiceTitle': 'टैक्स इनवॉइस (TAX INVOICE)',
    'doc.solarQuotationTitle': 'सोलर कमर्शियल कोटेशन (OFFER)',
    'doc.quotationTitle': 'व्यावसायिक कोटेशन (QUOTATION)',
    'doc.wccTitle': 'कार्य पूर्णता प्रमाणपत्र (WORK COMPLETION)',
    'doc.estimateTitle': 'बैंक लोन एस्टीमेट कोटेशन',
    'doc.marginReceiptTitle': 'मार्जिन मनी व भुगतान रसीद',
    'doc.billTo': 'ग्राहक विवरण (Billed To)',
    'doc.shipTo': 'डिलीवरी / स्थापना स्थल (Site Address)',
    'doc.itemsTable': 'वस्तु एवं सेवाओं का विवरण',
    'doc.qty': 'मात्रा (Qty)',
    'doc.unit': 'इकाई (Unit)',
    'doc.rate': 'दर (Rate)',
    'doc.gst': 'जीएसटी%',
    'doc.taxable': 'करयोग्य मूल्य',
    'doc.cgst': 'CGST कर',
    'doc.sgst': 'SGST कर',
    'doc.total': 'कुल राशि',
    'doc.grandTotal': 'कुल देय राशि (Grand Total)',
    'doc.roundOff': 'राउंड ऑफ',
    'doc.subTotal': 'उप-कुल',
    'doc.amountInWords': 'कुल राशि (शब्दों में)',
    'doc.bankDetails': 'बैंक खाता विवरण',
    'doc.terms': 'नियम व शर्तें',
    'doc.authSign': 'अधिकृत हस्ताक्षरकर्ता (Authorized Signatory)',
    'doc.customerSign': 'ग्राहक के हस्ताक्षर',
    
    // Receipt Specific
    'receipt.receiptNo': 'रसीद संख्या',
    'receipt.receiptDate': 'दिनांक',
    'receipt.dealAmount': 'कुल प्रोजेक्ट सौदा राशि',
    'receipt.subsidy': 'अनुमानित सरकारी सब्सिडी (DBT)',
    'receipt.marginDue': 'ग्राहक अंशदान (मार्जिन मनी)',
    'receipt.amountReceived': 'प्राप्त राशि (नकद / ऑनलाइन)',
    'receipt.balanceDue': 'शेष बकाया राशि',
    'receipt.paymentMode': 'भुगतान माध्यम',
    'receipt.cash': 'नकद भुगतान (Cash)',
    'receipt.upi': 'UPI / ऑनलाइन ट्रांसफर',
    'receipt.neft': 'बैंक NEFT / RTGS / IMPS',
    'receipt.cheque': 'चेक द्वारा भुगतान',
    'receipt.notes': 'विशेष विवरण व टिप्पणी',
  },
};

export function getLanguage(): Language {
  try {
    const saved = localStorage.getItem('nb_language');
    if (saved === 'hi' || saved === 'en') return saved;
  } catch {}
  return 'en';
}

export function setLanguage(lang: Language) {
  try {
    localStorage.setItem('nb_language', lang);
  } catch {}
}

export function t(key: string, lang?: Language): string {
  const activeLang = lang || getLanguage();
  return TRANSLATIONS[activeLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
}
