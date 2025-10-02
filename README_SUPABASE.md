# CalidaEscencia - Supabase Integration Guide

## 🚀 Setup Instructions

### 1. Database Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Go to SQL Editor and run the complete schema from `database/schema.sql`
3. Get your project credentials from Settings > API

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Database Schema Overview

The database includes the following main tables:

#### Authentication & Users
- `users` - User profiles with roles (admin/customer)

#### Product Management
- `categories` - Product categories (aros, collares, anillos, pulseras)
- `subcategories` - Material types (Acero quirúrgico, blanco, dorado, Plata 925)
- `models` - Model references
- `names` - Product naming system
- `materials` - Raw materials with stock tracking
- `products` - Main product catalog
- `product_materials` - Bill of materials (BOM)
- `product_inventory` - Finished product inventory

#### Sales & Finance
- `sales` - Sales transactions
- `sale_items` - Individual sale line items
- `expenses` - Business expenses
- `income` - Other income sources
- `salaries` - Employee salary records
- `cash_closures` - Daily cash register closures

#### Inventory Management
- `stock_movements` - Material stock tracking
- `purchase_orders` - Material purchasing
- `purchase_order_items` - Purchase order line items

#### Reporting Views
- `sales_summary` - Daily sales aggregation
- `low_stock_materials` - Materials below minimum stock
- `product_profitability` - Product profit analysis

### 4. Row Level Security (RLS)

All tables have RLS enabled with the following policies:
- **Admins**: Full access to all operations
- **Customers**: Read-only access to active products
- **Public**: No access (authentication required)

### 5. API Structure

The API is organized into modules:

#### Products API (`/src/lib/api/products.ts`)
- Categories, subcategories, models, names management
- Materials and inventory management
- Products with full BOM integration
- Stock movements and tracking

#### Finance API (`/src/lib/api/finances.ts`)
- Sales management with line items
- Expenses, income, and salary tracking
- Cash closure operations
- Financial reporting

#### Auth API (`/src/lib/api/auth.ts`)
- User authentication and profiles
- Admin role management
- Password reset and updates
- React hooks for auth state

### 6. Usage Examples

#### Creating a Product
```typescript
import { productApi } from '@/lib/api';

// Create product with materials
const newProduct = await productApi.products.create({
  name: "Aro de Acero Inoxidable",
  category_id: "category-uuid",
  subcategory_id: "subcategory-uuid",
  cost: 15.00,
  price: 25.00
});

// Add materials to product
await productApi.products.addMaterial({
  product_id: newProduct.data.id,
  material_id: "material-uuid",
  quantity: 2
});
```

#### Recording a Sale
```typescript
import { financeApi } from '@/lib/api';

const sale = await financeApi.sales.create(
  {
    customer_name: "Juan Pérez",
    total_amount: 50.00,
    payment_method: "cash"
  },
  [
    {
      product_id: "product-uuid",
      quantity: 2,
      unit_price: 25.00,
      total_price: 50.00
    }
  ]
);
```

#### Authentication
```typescript
import { useAuth } from '@/lib/api';

function AdminComponent() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdmin) return <div>Access Denied</div>;

  return <div>Admin Content</div>;
}
```

### 7. Admin Panel Features

#### Products Management
- ✅ Complete product catalog with categories and materials
- ✅ Bill of Materials (BOM) management
- ✅ Stock tracking and inventory management
- ✅ Material-based stock ingress interface

#### Financial Dashboard
- ✅ Sales recording and tracking
- ✅ Expense and income management
- ✅ Salary tracking
- ✅ Cash closure operations
- ✅ Financial reporting and analytics

#### Inventory Control
- ✅ Material stock movements
- ✅ Low stock alerts
- ✅ Purchase order management
- ✅ Automatic stock updates

### 8. Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Row Level Security on all tables
- API key protection
- Input validation and sanitization

### 9. Development Workflow

1. **Database Changes**: Update `database/schema.sql` and run migrations
2. **Type Updates**: Update types in `src/types/database.ts`
3. **API Changes**: Update relevant API files in `src/lib/api/`
4. **UI Integration**: Update admin panel pages to use new APIs

### 10. Deployment Checklist

- [ ] Set up Supabase project
- [ ] Run database schema
- [ ] Configure environment variables
- [ ] Test authentication flow
- [ ] Verify RLS policies
- [ ] Test all CRUD operations
- [ ] Validate admin panel functionality

## 🔧 API Reference

### Products API
- `productApi.categories.*` - Category management
- `productApi.subcategories.*` - Subcategory management
- `productApi.models.*` - Model management
- `productApi.names.*` - Name management
- `productApi.materials.*` - Material management
- `productApi.products.*` - Product management
- `productApi.inventory.*` - Inventory management

### Finance API
- `financeApi.sales.*` - Sales management
- `financeApi.expenses.*` - Expense tracking
- `financeApi.income.*` - Income tracking
- `financeApi.salaries.*` - Salary management
- `financeApi.cashClosures.*` - Cash closure operations

### Auth API
- `authApi.signIn/signUp/signOut` - Authentication
- `authApi.getCurrentUser` - User data
- `authApi.updateProfile` - Profile management
- `useAuth()` - React hook for auth state
- `requireAuth/requireAdmin()` - Route protection

## 📊 Database Relationships

```
Categories → Subcategories → Products
Models → Products
Names → Products
Materials → Product_Materials ← Products
Products → Product_Inventory
Products → Sale_Items ← Sales
Materials → Stock_Movements
Users → Sales/Expenses/Income/Salaries
Cash_Closures (Daily financial summaries)
```

This setup provides a complete, production-ready e-commerce and inventory management system with robust authentication, financial tracking, and admin controls.