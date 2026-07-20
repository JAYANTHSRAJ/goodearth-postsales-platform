import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../../../services/payment.service';
import { Payment } from '../types/payments.types';

export interface PaymentReceipt {
  id: string;
  buyerName: string;
  projectName: string;
  unitName: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  transactionId: string;
  paymentDate: string;
}

export interface InvoiceSchedule {
  id: string;
  zohoInvoiceId: string;
  amount: string;
  status: 'sent' | 'paid' | 'overdue' | 'void';
  dueDate: string;
  remarks: string;
}

export const usePayments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination states
  const [receiptsPage, setReceiptsPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const pageSize = 10;

  // Sorting states
  const [receiptsSortField, setReceiptsSortField] = useState<keyof Payment>('paymentDate');
  const [receiptsSortOrder, setReceiptsSortOrder] = useState<'asc' | 'desc'>('desc');

  const [invoicesSortField, setInvoicesSortField] = useState<keyof InvoiceSchedule>('dueDate');
  const [invoicesSortOrder, setInvoicesSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentService.getPayments(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => paymentService.getInvoices(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isPaymentsLoading || isInvoicesLoading;

  // RECEIPTS filtering, sorting, pagination
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.unitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const sortedPayments = useMemo(() => {
    const sorted = [...filteredPayments];
    sorted.sort((a, b) => {
      let aVal = a[receiptsSortField] || '';
      let bVal = b[receiptsSortField] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return receiptsSortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return receiptsSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredPayments, receiptsSortField, receiptsSortOrder]);

  const totalReceiptsPages = Math.max(1, Math.ceil(sortedPayments.length / pageSize));

  const paginatedPayments = useMemo(() => {
    const startIndex = (receiptsPage - 1) * pageSize;
    return sortedPayments.slice(startIndex, startIndex + pageSize);
  }, [sortedPayments, receiptsPage]);

  // INVOICES filtering, sorting, pagination
  const filteredInvoices = useMemo(() => {
    return invoices.map((inv) => {
      return {
        id: inv.id,
        zohoInvoiceId: inv.zohoInvoiceId || '—',
        amount: `₹${inv.amount ? inv.amount.toFixed(2) : '0.00'}`,
        status: inv.status ? inv.status.toLowerCase() : 'sent',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—',
        remarks: inv.remarks || 'Construction Milestone Payment',
      };
    }).filter((inv) => {
      const matchesSearch =
        inv.zohoInvoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.remarks?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const sortedInvoices = useMemo(() => {
    const sorted = [...filteredInvoices];
    sorted.sort((a, b) => {
      let aVal = a[invoicesSortField] || '';
      let bVal = b[invoicesSortField] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return invoicesSortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return invoicesSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredInvoices, invoicesSortField, invoicesSortOrder]);

  const totalInvoicesPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));

  const paginatedInvoices = useMemo(() => {
    const startIndex = (invoicesPage - 1) * pageSize;
    return sortedInvoices.slice(startIndex, startIndex + pageSize);
  }, [sortedInvoices, invoicesPage]);

  const handleNextPage = (tab: 'receipts' | 'invoices') => {
    if (tab === 'receipts' && receiptsPage < totalReceiptsPages) {
      setReceiptsPage((p) => p + 1);
    } else if (tab === 'invoices' && invoicesPage < totalInvoicesPages) {
      setInvoicesPage((p) => p + 1);
    }
  };

  const handlePreviousPage = (tab: 'receipts' | 'invoices') => {
    if (tab === 'receipts' && receiptsPage > 1) {
      setReceiptsPage((p) => p - 1);
    } else if (tab === 'invoices' && invoicesPage > 1) {
      setInvoicesPage((p) => p - 1);
    }
  };

  const handleSortReceipts = (field: keyof Payment) => {
    if (receiptsSortField === field) {
      setReceiptsSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setReceiptsSortField(field);
      setReceiptsSortOrder('asc');
    }
    setReceiptsPage(1);
  };

  const handleSortInvoices = (field: keyof InvoiceSchedule) => {
    if (invoicesSortField === field) {
      setInvoicesSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setInvoicesSortField(field);
      setInvoicesSortOrder('asc');
    }
    setInvoicesPage(1);
  };

  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const paidCount = payments.filter((p) => p.status === 'paid').length;
    const pendingCount = payments.filter((p) => p.status === 'pending').length;

    return {
      totalPayments,
      paidCount,
      pendingCount,
    };
  }, [payments]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredPayments: paginatedPayments,
    filteredInvoices: paginatedInvoices,
    isLoading,
    stats,
    // Pagination
    receiptsPage,
    invoicesPage,
    totalReceiptsPages,
    totalInvoicesPages,
    onNextPage: handleNextPage,
    onPreviousPage: handlePreviousPage,
    // Sorting
    receiptsSortField,
    receiptsSortOrder,
    invoicesSortField,
    invoicesSortOrder,
    onSortReceipts: handleSortReceipts,
    onSortInvoices: handleSortInvoices,
  };
};

export default usePayments;
