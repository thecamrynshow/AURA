# Veluna IAP Fix - Swift Code Changes

## Product IDs Identified
- **Annual:** `com.veluna.periodcycle.premium.annual`
- **Monthly:** `com.veluna.periodcycle.premium.monthly` (likely)

---

## Step 1: Find and Remove "Premium Coming Soon" Code

### Search your Xcode project for these strings:
1. `"Premium Coming Soon"`
2. `"In-app purchases will be enabled"`
3. `"next update"`
4. `"Coming Soon"`

**Common file locations:**
- `PremiumView.swift` or `SubscriptionView.swift`
- `IAPManager.swift` or `StoreKitManager.swift`
- `SettingsView.swift` or `PaywallView.swift`

---

## Step 2: Fix the Purchase Flow

### ❌ **BEFORE (What's causing the rejection):**

```swift
// ❌ REMOVE THIS PATTERN:
func showPremiumScreen() {
    if isPremiumEnabled { // ← This is probably false
        showPurchaseOptions()
    } else {
        // ❌ THIS IS THE PROBLEM:
        showAlert(
            title: "Premium Coming Soon",
            message: "In-app purchases will be enabled in the next update. Thank you for your interest!",
            productID: "com.veluna.periodcycle.premium.annual"
        )
    }
}
```

### ✅ **AFTER (Correct implementation):**

```swift
import StoreKit

class PremiumView: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = true
    @Published var purchaseError: String?
    
    private let productIDs = [
        "com.veluna.periodcycle.premium.annual",
        "com.veluna.periodcycle.premium.monthly"
    ]
    
    init() {
        Task {
            await loadProducts()
        }
    }
    
    // ✅ Load products from App Store
    func loadProducts() async {
        isLoading = true
        do {
            let storeProducts = try await Product.products(for: productIDs)
            await MainActor.run {
                self.products = storeProducts
                self.isLoading = false
                
                // ✅ If no products, show error (not "Coming Soon")
                if storeProducts.isEmpty {
                    self.purchaseError = "Subscriptions are temporarily unavailable. Please try again later."
                }
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
                self.purchaseError = "Unable to load subscriptions. Please check your connection and try again."
            }
            print("❌ Failed to load products: \(error)")
        }
    }
    
    // ✅ Purchase function
    func purchase(_ product: Product) async {
        do {
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                // Verify transaction
                let transaction = try checkVerified(verification)
                
                // Update premium status
                await updatePremiumStatus()
                
                // Finish transaction
                await transaction.finish()
                
            case .userCancelled:
                // User cancelled - do nothing
                break
                
            case .pending:
                // Purchase is pending (e.g., waiting for parental approval)
                await MainActor.run {
                    self.purchaseError = "Purchase is pending approval"
                }
                
            @unknown default:
                break
            }
        } catch {
            await MainActor.run {
                self.purchaseError = "Purchase failed: \(error.localizedDescription)"
            }
        }
    }
    
    func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    func updatePremiumStatus() async {
        // Update your app's premium status
        // e.g., UserDefaults, keychain, or backend API
    }
}

enum StoreError: Error {
    case failedVerification
}
```

---

## Step 3: Update Your Premium Screen UI

### ✅ **Correct Premium Screen:**

```swift
import SwiftUI

struct PremiumView: View {
    @StateObject private var store = PremiumView()
    
    var body: some View {
        VStack(spacing: 24) {
            // Header
            Text("Premium")
                .font(.largeTitle)
                .bold()
            
            if store.isLoading {
                ProgressView("Loading subscriptions...")
            } else if let error = store.purchaseError {
                // ✅ Show error, NOT "Coming Soon"
                VStack {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text(error)
                        .multilineTextAlignment(.center)
                        .padding()
                }
            } else if store.products.isEmpty {
                // ✅ No products available
                Text("Subscriptions are temporarily unavailable.\nPlease try again later.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
            } else {
                // ✅ Show purchase options
                ForEach(store.products, id: \.id) { product in
                    SubscriptionCard(product: product) {
                        Task {
                            await store.purchase(product)
                        }
                    }
                }
            }
            
            // Terms and Privacy
            HStack {
                Link("Terms of Use", destination: URL(string: "https://veluna.com/terms")!)
                Text("•")
                Link("Privacy Policy", destination: URL(string: "https://veluna.com/privacy")!)
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding()
    }
}

struct SubscriptionCard: View {
    let product: Product
    let onPurchase: () -> Void
    
    var isAnnual: Bool {
        product.id.contains("annual")
    }
    
    var body: some View {
        Button(action: onPurchase) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(isAnnual ? "Annual" : "Monthly")
                        .font(.headline)
                    if isAnnual {
                        Spacer()
                        Text("Most Popular")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.purple.opacity(0.2))
                            .cornerRadius(8)
                    }
                }
                
                Text(product.displayPrice)
                    .font(.title2)
                    .bold()
                
                if isAnnual {
                    Text("Save 50% vs monthly")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text("Flexible billing")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(isAnnual ? Color.purple.opacity(0.1) : Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}
```

---

## Step 4: Remove All "Coming Soon" Logic

### Search and replace these patterns:

#### Pattern 1: Boolean flag check
```swift
// ❌ FIND THIS:
let isPremiumAvailable = false
let premiumComingSoon = true

// ✅ REPLACE WITH:
// Remove these flags entirely - check products array instead
```

#### Pattern 2: Alert/AlertView
```swift
// ❌ FIND THIS:
Alert(
    title: Text("Premium Coming Soon"),
    message: Text("In-app purchases will be enabled in the next update."),
    dismissButton: .default(Text("OK"))
)

// ✅ DELETE THIS ENTIRELY
```

#### Pattern 3: Conditional display
```swift
// ❌ FIND THIS:
if premiumEnabled {
    showPurchaseButton()
} else {
    showComingSoonMessage() // ← DELETE THIS
}

// ✅ REPLACE WITH:
if !store.products.isEmpty {
    showPurchaseButton()
} else {
    showError("Subscriptions unavailable") // ← Better error message
}
```

---

## Step 5: Verify App Store Connect Configuration

1. **Go to App Store Connect**
2. **Your App → Features → In-App Purchases**
3. **Verify these products exist:**
   - `com.veluna.periodcycle.premium.annual`
   - `com.veluna.periodcycle.premium.monthly`
4. **Check status:** Should be "Ready to Submit" (green checkmark)
5. **Verify:**
   - ✅ Product ID matches code exactly
   - ✅ Price is set
   - ✅ Display name and description are filled
   - ✅ Subscription group is assigned
   - ✅ Product is added to your app's "In-App Purchases" section

---

## Step 6: Test in Sandbox

### Before resubmitting:

1. **Create Sandbox Tester:**
   - App Store Connect → Users and Access → Sandbox Testers
   - Create new tester account

2. **Test on Device:**
   ```bash
   # Build and install on device
   # Sign out of App Store in Settings
   # Launch app
   # When prompted, sign in with sandbox tester
   # Try to purchase subscription
   ```

3. **Verify:**
   - ✅ No "Coming Soon" message appears
   - ✅ Purchase flow completes
   - ✅ Subscription status updates
   - ✅ No errors in console

---

## Step 7: Check Paid Apps Agreement

**Critical:** This must be active before IAPs work.

1. App Store Connect → **Agreements, Tax, and Banking**
2. Check **"Paid Apps Agreement"** status
3. If not active:
   - Complete banking information
   - Complete tax forms (W-9 for US)
   - Submit for review (24-48 hours)

---

## Quick Checklist

Before resubmitting, verify:

- [ ] Removed all "Premium Coming Soon" code
- [ ] Removed all "next update" messages
- [ ] Products load from StoreKit before showing purchase options
- [ ] Error handling shows appropriate messages (not "Coming Soon")
- [ ] Product IDs match App Store Connect exactly
- [ ] Tested purchase flow in sandbox
- [ ] Paid Apps Agreement is Active
- [ ] No hardcoded availability flags
- [ ] Purchase flow completes successfully

---

## Common Mistakes to Avoid

1. **❌ Don't:** Check a boolean flag before loading products
2. **✅ Do:** Load products first, then check if array is empty

3. **❌ Don't:** Show "Coming Soon" if products fail to load
4. **✅ Do:** Show error message and retry option

5. **❌ Don't:** Hardcode `isPremiumAvailable = false`
6. **✅ Do:** Check `products.isEmpty` after loading

---

## If You Still See Issues

1. **Check Xcode Console:**
   - Look for StoreKit errors
   - Verify product IDs are being requested

2. **Verify Product IDs:**
   ```swift
   // Print product IDs to console
   print("Requesting products: \(productIDs)")
   ```

3. **Check Network:**
   - Ensure device has internet connection
   - Try on different network

4. **Verify App Store Connect:**
   - Products must be "Ready to Submit"
   - Not "Missing Metadata" or "Waiting for Review"

---

## Example: Complete IAP Manager

Here's a complete, production-ready IAP manager:

```swift
import StoreKit
import Foundation

@MainActor
class IAPManager: ObservableObject {
    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let productIDs: Set<String> = [
        "com.veluna.periodcycle.premium.annual",
        "com.veluna.periodcycle.premium.monthly"
    ]
    
    init() {
        Task {
            await loadProducts()
            await checkPurchases()
        }
    }
    
    func loadProducts() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let storeProducts = try await Product.products(for: productIDs)
            self.products = storeProducts.sorted { $0.price < $1.price }
            isLoading = false
        } catch {
            errorMessage = "Unable to load subscriptions. Please try again."
            isLoading = false
            print("❌ Product loading error: \(error)")
        }
    }
    
    func purchase(_ product: Product) async throws {
        do {
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await updatePurchaseStatus(transaction)
                await transaction.finish()
                
            case .userCancelled:
                throw IAPError.userCancelled
                
            case .pending:
                throw IAPError.pending
                
            @unknown default:
                throw IAPError.unknown
            }
        } catch {
            throw error
        }
    }
    
    func checkPurchases() async {
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                await updatePurchaseStatus(transaction)
            } catch {
                print("❌ Verification failed: \(error)")
            }
        }
    }
    
    private func updatePurchaseStatus(_ transaction: Transaction) async {
        if transaction.productID.contains("premium") {
            purchasedProductIDs.insert(transaction.productID)
            // Update your app's premium status
            UserDefaults.standard.set(true, forKey: "isPremium")
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw IAPError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    var isPremium: Bool {
        !purchasedProductIDs.isEmpty
    }
}

enum IAPError: LocalizedError {
    case failedVerification
    case userCancelled
    case pending
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .failedVerification:
            return "Purchase verification failed"
        case .userCancelled:
            return "Purchase cancelled"
        case .pending:
            return "Purchase pending approval"
        case .unknown:
            return "Unknown error occurred"
        }
    }
}
```

---

## Next Steps

1. **Find and remove** all "Coming Soon" code
2. **Implement** proper StoreKit product loading
3. **Test** in sandbox environment
4. **Verify** Paid Apps Agreement is active
5. **Resubmit** to App Store
6. **Reply to Apple** explaining what was fixed

Good luck! 🚀
