import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RiArrowLeftLine, 
  RiUserLine, 
  RiBookLine, 
  RiBarcodeLine,
  RiAddLine,
  RiDeleteBinLine,
  RiMoneyDollarCircleLine,
  RiCalendarLine,
  RiSearchLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import readerService from '../../services/readerService';
import bookService from '../../services/bookService';
import borrowService from '../../services/borrowService';

const BorrowTransaction = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1: Reader selection
  const [readerSearch, setReaderSearch] = useState('');
  const [selectedReader, setSelectedReader] = useState(null);
  const [readerResults, setReaderResults] = useState([]);
  
  // Step 2: Book selection
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [bookResults, setBookResults] = useState([]);
  
  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('1');
  const [processing, setProcessing] = useState(false);

  const searchReader = async () => {
    if (!readerSearch.trim()) return;
    try {
      const response = await readerService.search(readerSearch);
      setReaderResults(response.data || []);
    } catch (error) {
      toast.error('Tìm kiếm thất bại');
    }
  };

  const searchBook = async () => {
    if (!bookSearch.trim()) return;
    try {
      const response = await bookService.searchByBarcode(bookSearch);
      setBookResults(response.data ? [response.data] : []);
    } catch (error) {
      toast.error('Không tìm thấy sách');
    }
  };

  const addBook = (book) => {
    if (selectedBooks.find(b => b.copy_id === book.copy_id)) {
      toast.error('Sách này đã được thêm');
      return;
    }
    
    const borrowDays = 14;
    const dailyFee = book.borrow_price_per_day || 3000;
    
    setSelectedBooks([...selectedBooks, {
      ...book,
      borrow_days: borrowDays,
      daily_fee: dailyFee,
      subtotal: borrowDays * dailyFee
    }]);
    setBookSearch('');
    setBookResults([]);
  };

  const removeBook = (copyId) => {
    setSelectedBooks(selectedBooks.filter(b => b.copy_id !== copyId));
  };

  const calculateTotal = () => {
    return selectedBooks.reduce((acc, book) => acc + book.subtotal, 0);
  };

  const handleSubmit = async () => {
    if (!selectedReader) {
      toast.error('Vui lòng chọn độc giả');
      return;
    }
    if (selectedBooks.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sách');
      return;
    }

    setProcessing(true);
    try {
      // Create transaction
      const txResponse = await borrowService.create({
        reader_id: selectedReader.reader_id,
        payment_method_id: parseInt(paymentMethod),
        notes: ''
      });

      if (txResponse.data?.transaction_id) {
        // Add books
        for (const book of selectedBooks) {
          await borrowService.addBook(txResponse.data.transaction_id, {
            copy_id: book.copy_id,
            borrow_days: book.borrow_days,
            daily_fee: book.daily_fee
          });
        }

        // Finalize
        await borrowService.finalize(txResponse.data.transaction_id);
        
        toast.success('Tạo phiếu mượn thành công');
        navigate('/borrowing');
      }
    } catch (error) {
      toast.error('Tạo phiếu mượn thất bại');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/borrowing')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <RiArrowLeftLine className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu mượn mới</h1>
          <p className="text-gray-500">Bước {step}/3: {step === 1 ? 'Chọn độc giả' : step === 2 ? 'Chọn sách' : 'Thanh toán'}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
              s <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-1 mx-2 ${
                s < step ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Reader */}
      {step === 1 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Tìm độc giả</h3>
          
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập mã thẻ, tên, SĐT hoặc email..."
                value={readerSearch}
                onChange={(e) => setReaderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && searchReader()}
              />
            </div>
            <button onClick={searchReader} className="btn-primary">
              Tìm kiếm
            </button>
          </div>

          {selectedReader ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <RiUserLine className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedReader.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedReader.card_number} • {selectedReader.phone}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReader(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  Đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {readerResults.map((reader) => (
                <div 
                  key={reader.reader_id}
                  onClick={() => setSelectedReader(reader)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{reader.full_name}</p>
                      <p className="text-sm text-gray-500">{reader.card_number} • {reader.phone}</p>
                    </div>
                    <span className="badge bg-primary-100 text-primary-800">
                      {reader.tier_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => selectedReader && setStep(2)}
              disabled={!selectedReader}
              className="btn-primary"
            >
              Tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Books */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Thêm sách</h3>
            
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <RiBarcodeLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quét mã barcode..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchBook()}
                  autoFocus
                />
              </div>
              <button onClick={searchBook} className="btn-primary">
                <RiAddLine className="w-5 h-5" />
              </button>
            </div>

            {/* Book Results */}
            {bookResults.length > 0 && (
              <div className="space-y-2 mb-4">
                {bookResults.map((book) => (
                  <div 
                    key={book.copy_id}
                    className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <RiBookLine className="w-8 h-8 text-primary-600" />
                      <div>
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-gray-500">{book.barcode}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => addBook(book)}
                      className="btn-primary py-1 px-3"
                    >
                      Thêm
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Books */}
          {selectedBooks.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h4 className="font-medium">Sách đã chọn ({selectedBooks.length})</h4>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sách</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Barcode</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ngày</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phí/ngày</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Thành tiền</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBooks.map((book) => (
                    <tr key={book.copy_id} className="border-b">
                      <td className="px-4 py-3">{book.title}</td>
                      <td className="px-4 py-3 font-mono text-sm">{book.barcode}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          max="14"
                          value={book.borrow_days}
                          onChange={(e) => {
                            const days = parseInt(e.target.value) || 1;
                            setSelectedBooks(selectedBooks.map(b => 
                              b.copy_id === book.copy_id 
                                ? {...b, borrow_days: days, subtotal: days * b.daily_fee}
                                : b
                            ));
                          }}
                          className="w-16 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-4 py-3">{formatCurrency(book.daily_fee)}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(book.subtotal)}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => removeBook(book.copy_id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <RiDeleteBinLine className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Quay lại
            </button>
            <button
              onClick={() => selectedBooks.length > 0 && setStep(3)}
              disabled={selectedBooks.length === 0}
              className="btn-primary"
            >
              Tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Thanh toán</h3>
          
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Độc giả:</span>
              <span className="font-medium">{selectedReader?.full_name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Số sách:</span>
              <span className="font-medium">{selectedBooks.length} cuốn</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Tổng tiền:</span>
                <span className="font-bold text-primary-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="1"
                  checked={paymentMethod === '1'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span>Tiền mặt</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="2"
                  checked={paymentMethod === '2'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span>Chuyển khoản</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="btn-success gap-2"
            >
              <RiMoneyDollarCircleLine className="w-5 h-5" />
              {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowTransaction;
