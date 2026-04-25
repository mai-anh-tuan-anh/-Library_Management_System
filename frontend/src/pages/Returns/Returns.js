import React, { useState, useEffect } from 'react';
import {
    RiArrowGoBackLine,
    RiBarcodeLine,
    RiMoneyDollarCircleLine,
    RiSearchLine,
    RiCheckLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import borrowService from '../../services/borrowService';

const Returns = () => {
    const [barcode, setBarcode] = useState('');
    const [borrowDetail, setBorrowDetail] = useState(null);
    const [damageTypes, setDamageTypes] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(false);

    const [returnData, setReturnData] = useState({
        condition_on_return: 'good',
        damage_type_id: '',
        damage_description: '',
        fine_payment_method_id: '1'
    });

    // Store return calculation results
    const [returnResult, setReturnResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        loadReferenceData();
    }, []);

    const loadReferenceData = async () => {
        try {
            const [damageRes, paymentRes] = await Promise.all([
                borrowService.getDamageTypes(),
                borrowService.getPaymentMethods()
            ]);
            setDamageTypes(damageRes.data || []);
            setPaymentMethods(paymentRes.data || []);
        } catch (error) {
            console.error('Error loading reference data:', error);
        }
    };

    const searchByBarcode = async () => {
        if (!barcode.trim()) return;
        setLoading(true);
        try {
            const response = await borrowService.getAll({
                barcode,
                status: 'active'
            });
            if (response.data && response.data.length > 0) {
                // Get the first active borrow with this copy
                const transaction = response.data[0];
                // Find the detail with this barcode
                const detail = transaction.details?.find(
                    (d) => d.barcode === barcode
                );
                if (detail) {
                    setBorrowDetail({ ...detail, transaction });
                } else {
                    toast.error(
                        'Không tìm thấy sách đang được mượn với barcode này'
                    );
                }
            } else {
                toast.error('Không tìm thấy sách đang được mượn');
            }
        } catch (error) {
            toast.error('Tìm kiếm thất bại');
        } finally {
            setLoading(false);
        }
    };

    const calculateFine = () => {
        if (!borrowDetail) return 0;

        const expectedDate = new Date(
            borrowDetail.transaction.expected_return_date
        );
        const today = new Date();
        const daysLate = Math.max(
            0,
            Math.ceil((today - expectedDate) / (1000 * 60 * 60 * 24))
        );

        let lateFee = 0;
        if (daysLate > 0) {
            lateFee = borrowDetail.price * 0.5; // 50% of book price
        }

        let damageFee = 0;
        if (returnData.damage_type_id) {
            const damageType = damageTypes.find(
                (d) => d.damage_type_id === parseInt(returnData.damage_type_id)
            );
            if (damageType) {
                damageFee =
                    borrowDetail.price * (damageType.fine_percentage / 100);
            }
        }

        return lateFee + damageFee;
    };

    // Process return by barcode (new workflow)
    const handleReturnByBarcode = async () => {
        if (!barcode.trim()) {
            toast.error('Vui lòng nhập mã barcode');
            return;
        }

        try {
            const result = await borrowService.processReturnByBarcode({
                barcode: barcode,
                condition_on_return: returnData.condition_on_return,
                damage_type_id: returnData.damage_type_id || null,
                damage_description: returnData.damage_description,
                fine_payment_method_id:
                    returnResult?.total_fine > 0
                        ? returnData.fine_payment_method_id
                        : null
            });

            if (result.success) {
                toast.success('Trả sách thành công');
                setReturnResult(result.data);
                setShowConfirmModal(false);
                setBarcode('');
                setReturnData({
                    condition_on_return: 'good',
                    damage_type_id: '',
                    damage_description: '',
                    fine_payment_method_id: '1'
                });
                // Refresh borrow list
                loadActiveBorrows();
            } else {
                // Show confirmation modal with fee details
                setReturnResult(result.data);
                setShowConfirmModal(true);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Trả sách thất bại');
        }
    };

    const handleSubmit = async () => {
        if (!borrowDetail) return;

        try {
            const fine = calculateFine();

            await borrowService.processReturn({
                detail_id: borrowDetail.detail_id,
                condition_on_return: returnData.condition_on_return,
                damage_type_id: returnData.damage_type_id || null,
                damage_description: returnData.damage_description,
                fine_payment_method_id:
                    fine > 0 ? returnData.fine_payment_method_id : null
            });

            toast.success('Trả sách thành công');
            setBorrowDetail(null);
            setBarcode('');
            setReturnData({
                condition_on_return: 'good',
                damage_type_id: '',
                damage_description: '',
                fine_payment_method_id: '1'
            });
        } catch (error) {
            toast.error('Trả sách thất bại');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    return (
        <div className='max-w-3xl mx-auto'>
            <div className='flex items-center gap-4 mb-6'>
                <div className='p-3 bg-green-100 rounded-lg'>
                    <RiArrowGoBackLine className='w-6 h-6 text-green-600' />
                </div>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                        Trả sách
                    </h1>
                    <p className='text-gray-500'>
                        Quét barcode để xử lý trả sách
                    </p>
                </div>
            </div>

            {/* Barcode Input */}
            <div className='card p-6 mb-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Mã barcode sách
                </label>
                <div className='flex gap-3'>
                    <div className='relative flex-1'>
                        <RiBarcodeLine className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Quét hoặc nhập barcode...'
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === 'Enter' && searchByBarcode()
                            }
                            className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={searchByBarcode}
                        disabled={loading}
                        className='btn-primary gap-2'
                    >
                        <RiSearchLine className='w-5 h-5' />
                        Tìm
                    </button>
                </div>
            </div>

            {/* Borrow Detail */}
            {borrowDetail && (
                <div className='space-y-6'>
                    <div className='card p-6'>
                        <h3 className='text-lg font-semibold mb-4'>
                            Thông tin mượn
                        </h3>
                        <div className='grid grid-cols-2 gap-4 mb-4'>
                            <div>
                                <label className='text-sm text-gray-500'>
                                    Độc giả
                                </label>
                                <p className='font-medium'>
                                    {borrowDetail.transaction.reader_name}
                                </p>
                            </div>
                            <div>
                                <label className='text-sm text-gray-500'>
                                    Mã phiếu
                                </label>
                                <p className='font-medium font-mono'>
                                    {borrowDetail.transaction.transaction_code}
                                </p>
                            </div>
                            <div>
                                <label className='text-sm text-gray-500'>
                                    Sách
                                </label>
                                <p className='font-medium'>
                                    {borrowDetail.title}
                                </p>
                            </div>
                            <div>
                                <label className='text-sm text-gray-500'>
                                    Barcode
                                </label>
                                <p className='font-medium font-mono'>
                                    {borrowDetail.barcode}
                                </p>
                            </div>
                            <div>
                                <label className='text-sm text-gray-500'>
                                    Ngày mượn
                                </label>
                                <p className='font-medium'>
                                    {new Date(
                                        borrowDetail.transaction.borrow_date
                                    ).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <div>
                                <label className='text-sm text-gray-500'>
                                    Hạn trả
                                </label>
                                <p
                                    className={`font-medium ${new Date(borrowDetail.transaction.expected_return_date) < new Date() ? 'text-red-600' : ''}`}
                                >
                                    {new Date(
                                        borrowDetail.transaction
                                            .expected_return_date
                                    ).toLocaleDateString('vi-VN')}
                                    {new Date(
                                        borrowDetail.transaction
                                            .expected_return_date
                                    ) < new Date() && (
                                        <span className='ml-2 text-sm'>
                                            (Quá hạn{' '}
                                            {Math.ceil(
                                                (new Date() -
                                                    new Date(
                                                        borrowDetail.transaction
                                                            .expected_return_date
                                                    )) /
                                                    (1000 * 60 * 60 * 24)
                                            )}{' '}
                                            ngày)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Return Form */}
                    <div className='card p-6'>
                        <h3 className='text-lg font-semibold mb-4'>
                            Thông tin trả
                        </h3>

                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Tình trạng sách khi trả
                                </label>
                                <select
                                    value={returnData.condition_on_return}
                                    onChange={(e) =>
                                        setReturnData({
                                            ...returnData,
                                            condition_on_return: e.target.value
                                        })
                                    }
                                    className='input'
                                >
                                    <option value='new'>Mới</option>
                                    <option value='good'>Tốt</option>
                                    <option value='fair'>Khá</option>
                                    <option value='poor'>Kém</option>
                                    <option value='damaged'>Hư hỏng</option>
                                </select>
                            </div>

                            {returnData.condition_on_return === 'damaged' && (
                                <>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Loại hư hỏng
                                        </label>
                                        <select
                                            value={returnData.damage_type_id}
                                            onChange={(e) =>
                                                setReturnData({
                                                    ...returnData,
                                                    damage_type_id:
                                                        e.target.value
                                                })
                                            }
                                            className='input'
                                        >
                                            <option value=''>
                                                -- Chọn loại hư hỏng --
                                            </option>
                                            {damageTypes.map((type) => (
                                                <option
                                                    key={type.damage_type_id}
                                                    value={type.damage_type_id}
                                                >
                                                    {type.damage_name} (
                                                    {type.fine_percentage}% giá
                                                    sách)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Mô tả hư hỏng
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={
                                                returnData.damage_description
                                            }
                                            onChange={(e) =>
                                                setReturnData({
                                                    ...returnData,
                                                    damage_description:
                                                        e.target.value
                                                })
                                            }
                                            className='input'
                                            placeholder='Mô tả chi tiết về hư hỏng...'
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Fine Summary */}
                    {calculateFine() > 0 && (
                        <div className='card p-6 border-red-200 bg-red-50'>
                            <h3 className='text-lg font-semibold text-red-800 mb-4 flex items-center gap-2'>
                                <RiMoneyDollarCircleLine />
                                Thông tin phạt
                            </h3>

                            <div className='space-y-2 mb-4'>
                                {new Date(
                                    borrowDetail.transaction
                                        .expected_return_date
                                ) < new Date() && (
                                    <div className='flex justify-between'>
                                        <span>Phí trễ hạn (50% giá sách)</span>
                                        <span className='font-medium'>
                                            {formatCurrency(
                                                borrowDetail.price * 0.5
                                            )}
                                        </span>
                                    </div>
                                )}
                                {returnData.damage_type_id && (
                                    <div className='flex justify-between'>
                                        <span>Phí hư hỏng</span>
                                        <span className='font-medium'>
                                            {formatCurrency(
                                                (borrowDetail.price *
                                                    (damageTypes.find(
                                                        (d) =>
                                                            d.damage_type_id ===
                                                            parseInt(
                                                                returnData.damage_type_id
                                                            )
                                                    )?.fine_percentage || 0)) /
                                                    100
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className='border-t pt-2 flex justify-between text-lg font-bold text-red-800'>
                                    <span>Tổng phạt</span>
                                    <span>
                                        {formatCurrency(calculateFine())}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Phương thức thanh toán phạt
                                </label>
                                <div className='space-y-2'>
                                    {paymentMethods.map((method) => (
                                        <label
                                            key={method.method_id}
                                            className='flex items-center gap-2'
                                        >
                                            <input
                                                type='radio'
                                                name='fine_payment'
                                                value={method.method_id}
                                                checked={
                                                    returnData.fine_payment_method_id ===
                                                    String(method.method_id)
                                                }
                                                onChange={(e) =>
                                                    setReturnData({
                                                        ...returnData,
                                                        fine_payment_method_id:
                                                            e.target.value
                                                    })
                                                }
                                            />
                                            <span>{method.method_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='flex justify-end'>
                        <button
                            onClick={handleSubmit}
                            className='btn-success gap-2'
                        >
                            <RiCheckLine className='w-5 h-5' />
                            Xác nhận trả sách
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Return Fines */}
            {showConfirmModal && returnResult && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
                        <h3 className='text-lg font-bold mb-4'>
                            Xác nhận trả sách
                        </h3>

                        <div className='space-y-3 mb-4'>
                            <p>
                                <strong>Sách:</strong> {returnResult.book_title}
                            </p>
                            <p>
                                <strong>Số ngày trễ:</strong>{' '}
                                {returnResult.days_late} ngày
                            </p>

                            {returnResult.days_late > 0 && (
                                <div className='bg-yellow-50 p-2 rounded'>
                                    <p className='text-sm text-yellow-800'>
                                        Phí trễ hạn:{' '}
                                        {returnResult.late_fee?.toLocaleString()}
                                        đ
                                    </p>
                                </div>
                            )}

                            {returnData.damage_type_id && (
                                <div className='bg-red-50 p-2 rounded'>
                                    <p className='text-sm text-red-800'>
                                        Phí hư hỏng:{' '}
                                        {returnResult.damage_fee?.toLocaleString()}
                                        đ
                                    </p>
                                </div>
                            )}

                            {returnResult.total_fine > 0 && (
                                <div className='bg-blue-50 p-3 rounded font-bold'>
                                    <p className='text-blue-800'>
                                        Tổng phí:{' '}
                                        {returnResult.total_fine?.toLocaleString()}
                                        đ
                                    </p>
                                    <p className='text-sm text-blue-600 mt-1'>
                                        Vui lòng chọn phương thức thanh toán
                                    </p>
                                </div>
                            )}
                        </div>

                        {returnResult.total_fine > 0 && (
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>
                                    Phương thức thanh toán
                                </label>
                                <div className='space-y-2'>
                                    {paymentMethods.map((method) => (
                                        <label
                                            key={method.method_id}
                                            className='flex items-center gap-2'
                                        >
                                            <input
                                                type='radio'
                                                name='payment'
                                                value={method.method_id}
                                                checked={
                                                    returnData.fine_payment_method_id ===
                                                    String(method.method_id)
                                                }
                                                onChange={(e) =>
                                                    setReturnData({
                                                        ...returnData,
                                                        fine_payment_method_id:
                                                            e.target.value
                                                    })
                                                }
                                            />
                                            <span>{method.method_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='flex gap-3'>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className='btn-secondary flex-1'
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReturnByBarcode}
                                className='btn-success flex-1'
                                disabled={
                                    returnResult.total_fine > 0 &&
                                    !returnData.fine_payment_method_id
                                }
                            >
                                Xác nhận trả
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Returns;
