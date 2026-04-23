import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RiAddLine, 
  RiEyeLine, 
  RiExchangeLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiUserLine,
  RiBookLine
} from 'react-icons/ri';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import borrowService from '../../services/borrowService';

const getStatusBadge = (status) => {
  const styles = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  const labels = {
    active: 'Đang mượn',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy'
  };
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

const Borrowing = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await borrowService.getAll();
      setTransactions(response.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách phiếu mượn');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Mượn sách</h1>
          <p className="text-gray-500 mt-1">Danh sách phiếu mượn và xử lý mượn/trả</p>
        </div>
        <button 
          onClick={() => navigate('/borrowing/new')}
          className="btn-primary gap-2"
        >
          <RiAddLine className="w-5 h-5" />
          Tạo phiếu mượn mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RiExchangeLine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{transactions.filter(t => t.status === 'active').length}</p>
              <p className="text-sm text-gray-500">Đang mượn</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <RiCalendarLine className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {transactions.filter(t => new Date(t.expected_return_date) < new Date() && t.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Quá hạn</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RiMoneyDollarCircleLine className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(transactions.filter(t => t.status === 'active').reduce((acc, t) => acc + (t.borrow_fee || 0), 0))}
              </p>
              <p className="text-sm text-gray-500">Tiền mượn đang nợ</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RiExchangeLine className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{transactions.length}</p>
              <p className="text-sm text-gray-500">Tổng phiếu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Mã phiếu</th>
              <th className="table-header">Độc giả</th>
              <th className="table-header">Số sách</th>
              <th className="table-header">Ngày mượn</th>
              <th className="table-header">Hạn trả</th>
              <th className="table-header">Phí mượn</th>
              <th className="table-header">Trạng thái</th>
              <th className="table-header">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                  Chưa có phiếu mượn nào
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono font-medium">
                    {transaction.transaction_code}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <RiUserLine className="w-4 h-4 text-gray-400" />
                      {transaction.reader_name}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-blue-100 text-blue-800">
                      {transaction.total_books} cuốn
                    </span>
                  </td>
                  <td className="table-cell">
                    {format(new Date(transaction.borrow_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </td>
                  <td className="table-cell">
                    {format(new Date(transaction.expected_return_date), 'dd/MM/yyyy', { locale: vi })}
                  </td>
                  <td className="table-cell font-medium">
                    {formatCurrency(transaction.borrow_fee)}
                  </td>
                  <td className="table-cell">{getStatusBadge(transaction.status)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <RiEyeLine className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Borrowing;
