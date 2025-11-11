namespace RetailManagementSystem.Domain;

public enum OrderStatus { Unpaid = 0, Paid = 1, Voided = 2 }
public enum DiscountType { Percent = 1, Amount = 2 }
public enum DiscountScope { Global = 1, Category = 2, Product = 3, Coupon = 4 }
