namespace RetailManagementSystem.Data
{
    public class AppDbContext : DbContext
    {

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();


        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Product> Products => Set<Product>();


        public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
        public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
        public DbSet<StockLedger> StockLedger => Set<StockLedger>();


        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<CustomerPhone> CustomerPhones => Set<CustomerPhone>();


        public DbSet<Discount> Discounts => Set<Discount>();
        public DbSet<DiscountCategory> DiscountCategories => Set<DiscountCategory>();
        public DbSet<DiscountProduct> DiscountProducts => Set<DiscountProduct>();
        public DbSet<Coupon> Coupons => Set<Coupon>();
        public DbSet<CouponRedemption> CouponRedemptions => Set<CouponRedemption>();


        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<OrderStatusHistory> OrderStatusHistory => Set<OrderStatusHistory>();


        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();






        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // --- InventoryItem 1:1 with Product (cascade when product is hard-deleted) ---
            builder.Entity<InventoryItem>(i =>
            {
                i.ToTable("InventoryItems");
                i.HasKey(x => x.InventoryItemId);
                i.HasIndex(x => x.ProductId).IsUnique();
                i.HasOne(x => x.Product)
                 .WithOne(product => product.InventoryItem)
                 .HasForeignKey<InventoryItem>(x => x.ProductId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Users: unique username + unique email when present ---
            builder.Entity<User>()
                .HasIndex(user => user.UserName)
                .IsUnique();

            builder.Entity<User>()
                .HasIndex(user => user.Email)
                .IsUnique()
                .HasFilter("[Email] IS NOT NULL"); // SQL Server syntax

            // --- UserRole: composite PK (UserId, RoleId) ---
            builder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            builder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            builder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);

            // --- RefreshToken: (optional) unique token to prevent duplicates ---
            builder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token)
                .IsUnique();

            // --- Customers: unique email when present ---
            builder.Entity<Customer>()
                .HasIndex(customer => customer.Email)
                .IsUnique()
                .HasFilter("[Email] IS NOT NULL");

            // --- Orders: keep history if customer is deleted -> set null ---
            builder.Entity<Order>()
                .HasOne(order => order.Customer)
                .WithMany(customer => customer.Orders)
                .HasForeignKey(order => order.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            // --- CustomerPhones: cascade with customer ---
            builder.Entity<CustomerPhone>()
                .HasOne(phone => phone.Customer)
                .WithMany(customer => customer.Phones)
                .HasForeignKey(phone => phone.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // --- Category self reference: Restrict to protect tree ---
            builder.Entity<Category>()
                .HasOne(category => category.Parent)
                .WithMany(category => category.Children)
                .HasForeignKey(category => category.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // --- Product -> Category: Restrict (controller blocks delete when products exist) ---
            builder.Entity<Product>()
                .HasOne(product => product.Category)
                .WithMany(category => category.Products)
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // --- CouponRedemption: one per order ---
            builder.Entity<CouponRedemption>()
                .HasIndex(cr => cr.OrderId)
                .IsUnique();

            // --- AuditLogs: columns + helpful indexes ---
            builder.Entity<AuditLog>(b =>
            {
                b.ToTable("AuditLogs");
                b.HasKey(x => x.AuditLogId);

                b.Property(x => x.EntityName).HasMaxLength(100).IsRequired();
                b.Property(x => x.EntityId).HasMaxLength(64).IsRequired();
                b.Property(x => x.Action).HasMaxLength(30).IsRequired();
                b.Property(x => x.ChangesJson).HasColumnType("nvarchar(max)");
                b.Property(x => x.OccurredAt).HasColumnType("datetime2"); // store UTC

                // Indexes that match your API filters
                b.HasIndex(x => x.OccurredAt).HasDatabaseName("IX_AuditLogs_OccurredAt");
                b.HasIndex(x => new { x.EntityName, x.OccurredAt }).HasDatabaseName("IX_AuditLogs_Entity_At");
                b.HasIndex(x => new { x.UserId, x.OccurredAt }).HasDatabaseName("IX_AuditLogs_User_At");
                b.HasIndex(x => new { x.EntityId, x.EntityName }).HasDatabaseName("IX_AuditLogs_EntityId_Entity");
            });




        }




    }
}
