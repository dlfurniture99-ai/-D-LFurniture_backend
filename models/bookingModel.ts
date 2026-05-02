import mongoose, { Schema, Document, Model } from 'mongoose';

// Booking Interface
export interface IBooking extends Document {
    userId: mongoose.Types.ObjectId;
    orderId?: string;
    bookingId?: string; // Compatibility with older code
    items: {
        productId: mongoose.Types.ObjectId;
        productName: string;
        quantity: number;
        price: number;
        image?: string;
    }[];
    totalAmount: number;
    discountAmount?: number;
    finalAmount: number;
    bookingDate: Date;
    deliveryDate?: Date;
    deliveredDate?: Date;
    deliveryAddress: {
        name: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    billingAddress?: {
        name: string;
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    paymentMethod: 'creditCard' | 'debitCard' | 'netBanking' | 'upi' | 'wallet' | 'cod' | 'online' | 'card' | 'netbanking';
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    bookingStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'ready_for_delivery';
    cancellationReason?: string;
    cancellationDate?: Date;
    notes?: string;
    
    // Delivery Specific Fields (from old Booking.ts)
    deliveryOtp?: string;
    otpVerified: boolean;
    deliveryBoyId?: mongoose.Types.ObjectId;
    deliveryBoyName?: string;
    deliveryBoyPhone?: string;
    
    createdAt: Date;
    updatedAt: Date;
}

// Booking Schema
const BookingSchema = new Schema<IBooking>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        orderId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        bookingId: { // Alias for orderId to support older code
            type: String,
            sparse: true,
        },
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    required: [true, 'Product ID is required'],
                },
                productName: {
                    type: String,
                    required: [true, 'Product name is required'],
                },
                quantity: {
                    type: Number,
                    required: [true, 'Quantity is required'],
                    min: [1, 'Quantity must be at least 1'],
                },
                price: {
                    type: Number,
                    required: [true, 'Price is required'],
                    min: [0, 'Price cannot be negative'],
                },
                image: {
                    type: String,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Total amount cannot be negative'],
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
        },
        finalAmount: {
            type: Number,
            required: [true, 'Final amount is required'],
            min: [0, 'Final amount cannot be negative'],
        },
        bookingDate: {
            type: Date,
            default: Date.now,
            index: true,
        },
        deliveryDate: {
            type: Date,
        },
        deliveredDate: {
            type: Date,
        },
        deliveryAddress: {
            name: {
                type: String,
                required: [true, 'Recipient name is required'],
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                lowercase: true,
            },
            phone: {
                type: String,
                required: [true, 'Phone number is required'],
            },
            street: {
                type: String,
                required: [true, 'Street address is required'],
            },
            city: {
                type: String,
                required: [true, 'City is required'],
            },
            state: {
                type: String,
                required: [true, 'State is required'],
            },
            postalCode: {
                type: String,
                required: [true, 'Postal code is required'],
            },
            country: {
                type: String,
                default: 'India',
            },
        },
        billingAddress: {
            name: String,
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        },
        paymentMethod: {
            type: String,
            required: [true, 'Payment method is required'],
        },
        paymentStatus: {
            type: String,
            enum: {
                values: ['pending', 'completed', 'failed', 'refunded'],
                message: '{VALUE} is not a valid payment status',
            },
            default: 'pending',
            index: true,
        },
        transactionId: {
            type: String,
            sparse: true,
        },
        bookingStatus: {
            type: String,
            default: 'pending',
            index: true,
        },
        cancellationReason: {
            type: String,
        },
        cancellationDate: {
            type: Date,
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
        
        // Delivery Specific (from old Booking.ts)
        deliveryOtp: {
            type: String,
            select: false
        },
        otpVerified: {
            type: Boolean,
            default: false
        },
        deliveryBoyId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        deliveryBoyName: String,
        deliveryBoyPhone: String
    },
    {
        timestamps: true,
        collection: 'bookings',
    }
);

// Indexes
BookingSchema.index({ userId: 1, bookingDate: -1 });
BookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });

// Pre-save middleware
BookingSchema.pre<IBooking>('save', function (next) {
    if (!this.orderId) {
        this.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    if (!this.bookingId) {
        this.bookingId = this.orderId;
    }
    next();
});

// Export
const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;