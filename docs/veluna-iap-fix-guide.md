# Veluna IAP Rejection Fix Guide

## Issue Summary
**Rejection Reason:** Guideline 2.1 - Performance - App Completeness  
**Specific Error:** "Premium Coming Soon" error when reviewer attempts to purchase subscription  
**Review Device:** iPad Air 11-inch (M3), iPadOS 26.2.1

---

## Root Causes & Fixes

### 1. **IAP Product Configuration Issues**

**Check in App Store Connect:**
- Go to **App Store Connect** → Your App → **Features** → **In-App Purchases**
- Verify your subscription product exists and is **"Ready to Submit"** (not "Missing Metadata" or "Waiting for Review")
- Ensure all required fields are completed:
  - Product ID (e.g., `com.veluna.premium.monthly`)
  - Reference Name
  - Subscription Group (create one if needed)
  - Subscription Duration (Monthly, Yearly, etc.)
  - Price Tier
  - Localized Display Names and Descriptions

**Common Issues:**
- Product ID mismatch between App Store Connect and code
- Product not added to the app's "In-App Purchases" section
- Missing subscription group assignment

---

### 2. **Code-Side IAP Implementation**

**Check your Swift/Objective-C code:**

#### a) Product ID Verification
```swift
// Make sure this matches App Store Connect exactly
let productID = "com.veluna.premium.monthly" // Example - use your actual ID
```

#### b) StoreKit Request Handling
```swift
import StoreKit

class IAPManager: ObservableObject {
    @Published var products: [Product] = []
    
    func loadProducts() async {
        do {
            // Request products from App Store
            let productIDs = ["com.veluna.premium.monthly"] // Your product IDs
            let storeProducts = try await Product.products(for: productIDs)
            
            await MainActor.run {
                self.products = storeProducts
            }
            
            // Check if products are available
            if storeProducts.isEmpty {
                print("⚠️ No products found - check App Store Connect configuration")
            }
        } catch {
            print("❌ Failed to load products: \(error)")
        }
    }
    
    func purchase(_ product: Product) async throws -> Transaction? {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await transaction.finish()
            return transaction
        case .userCancelled:
            return nil
        case .pending:
            // Handle pending state
            return nil
        @unknown default:
            return nil
        }
    }
}
```

#### c) Remove "Coming Soon" Logic
**Find and remove any code that shows "Premium Coming Soon":**
```swift
// ❌ REMOVE THIS:
if isPremiumAvailable {
    // Show purchase button
} else {
    showAlert("Premium Coming Soon") // ← This is causing the rejection
}

// ✅ REPLACE WITH:
if let product = availableProduct {
    // Show purchase button
    await purchase(product)
} else {
    // Show loading state or error message
    showAlert("Unable to load subscription. Please try again later.")
}
```

---

### 3. **Sandbox Testing**

**Before resubmitting, test in sandbox:**

1. **Create Sandbox Tester Account:**
   - App Store Connect → **Users and Access** → **Sandbox Testers**
   - Create a new tester account (use a unique email)

2. **Test on Device:**
   - Sign out of your Apple ID in Settings → App Store
   - Launch your app
   - When prompted, sign in with sandbox tester account
   - Attempt to purchase subscription

3. **Verify:**
   - Purchase flow completes without errors
   - No "Coming Soon" messages appear
   - Subscription status updates correctly

---

### 4. **Paid Apps Agreement**

**Critical:** Apple requires the Account Holder to accept the Paid Apps Agreement.

**Steps:**
1. Log into App Store Connect
2. Go to **Agreements, Tax, and Banking**
3. Check if **"Paid Apps Agreement"** shows as **"Active"**
4. If not active:
   - Click **"Request Agreement"** or **"Review Agreement"**
   - Complete all required information:
     - Banking information
     - Tax forms (W-9 for US)
     - Contact information
   - Submit for review (can take 24-48 hours)

**Without this agreement, IAPs will not work during review.**

---

### 5. **Common Code Mistakes**

#### ❌ Wrong: Checking availability before products load
```swift
if premiumAvailable { // ← This might be false during review
    showPurchaseButton()
} else {
    showComingSoon() // ← Rejection!
}
```

#### ✅ Correct: Wait for StoreKit products
```swift
Task {
    await iapManager.loadProducts()
    if let product = iapManager.products.first {
        showPurchaseButton(product)
    } else {
        showError("Subscription temporarily unavailable")
    }
}
```

#### ❌ Wrong: Hardcoded availability flag
```swift
let isPremiumAvailable = false // ← Remove this!
```

#### ✅ Correct: Check actual product availability
```swift
let isPremiumAvailable = !iapManager.products.isEmpty
```

---

## Checklist Before Resubmission

- [ ] IAP product exists in App Store Connect and is "Ready to Submit"
- [ ] Product ID in code matches App Store Connect exactly
- [ ] All product metadata is complete (name, description, price)
- [ ] Subscription group is created and product is assigned
- [ ] Paid Apps Agreement is **Active** in App Store Connect
- [ ] Removed all "Coming Soon" or "Not Available" messages
- [ ] Tested purchase flow in sandbox environment
- [ ] Purchase flow completes successfully without errors
- [ ] Subscription status updates correctly after purchase
- [ ] Error handling shows appropriate messages (not "Coming Soon")

---

## Testing Script

1. **Clean build and install app**
2. **Sign out of App Store** (Settings → App Store → Sign Out)
3. **Launch app**
4. **Navigate to premium/subscription screen**
5. **Tap purchase button**
6. **Sign in with sandbox tester account** when prompted
7. **Complete purchase flow**
8. **Verify:**
   - No "Coming Soon" error appears
   - Purchase completes successfully
   - App recognizes premium status

---

## If Still Having Issues

1. **Check App Store Connect Status:**
   - Go to your app → **App Information**
   - Scroll to **In-App Purchases** section
   - Verify product shows as "Ready to Submit" (green checkmark)

2. **Review StoreKit Logs:**
   - In Xcode: **Window** → **Devices and Simulators**
   - Select your device → **Open Console**
   - Filter for "StoreKit" or "IAP"
   - Look for error messages

3. **Verify Product ID:**
   - Double-check product ID matches exactly (case-sensitive)
   - No extra spaces or characters

4. **Contact Apple:**
   - Use **"Reply to App Review"** button in App Store Connect
   - Explain what you've fixed
   - Request expedited review if needed

---

## Quick Fix Template

If you need to quickly disable IAP temporarily (not recommended for production):

```swift
// Temporary workaround - REMOVE before resubmission
#if DEBUG
let isPremiumAvailable = true
#else
let isPremiumAvailable = !iapManager.products.isEmpty
#endif
```

**But better:** Fix the root cause by ensuring products load correctly.

---

## Next Steps

1. Fix IAP configuration in App Store Connect
2. Update code to remove "Coming Soon" logic
3. Test thoroughly in sandbox
4. Ensure Paid Apps Agreement is active
5. Resubmit for review
6. Reply to Apple explaining what was fixed

---

## Additional Resources

- [Apple: In-App Purchase Configuration](https://developer.apple.com/in-app-purchase/)
- [StoreKit 2 Documentation](https://developer.apple.com/documentation/storekit)
- [App Store Review Guidelines 2.1](https://developer.apple.com/app-store/review/guidelines/#performance)
- [Apple Developer Forums - IAP](https://developer.apple.com/forums/tags/in-app-purchase)
