# دليل الترجمة العربية - Arabic Translation Guide

## ما تم إنجازه / What Has Been Completed ✓

### 1. تفعيل اللغة العربية الأساسية / Basic Arabic Setup
- ✅ تم إضافة `lang="ar" dir="rtl"` في HTML
- ✅ تم تغيير عنوان الصفحة إلى "فكرة سوفت وير - نقطة البيع"
- ✅ تم إنشاء ملف CSS للدعم RTL: `assets/css/arabic-rtl.css`
- ✅ تمت إضافة CSS للدعم العربي في HTML

### 2. الواجهة الرئيسية / Main Interface
**الأزرار المترجمة:**
- المنتجات (Products)
- التصنيفات (Categories)
- الطلبات المفتوحة (Open Tabs)
- طلبات العملاء (Customer Orders)
- المعاملات (Transactions)
- نقطة البيع (Point of Sale)
- المستخدمون (Users)

**صفحة تسجيل الدخول:**
- اسم المستخدم (Username)
- كلمة المرور (Password)
- تسجيل الدخول (Login)
- رسائل الخطأ بالعربية

### 3. شاشة نقطة البيع / POS Screen
- المنتج (Item)
- الكمية (Qty)
- السعر (Price)
- امسح الباركود (Scan barcode)

### 4. صفحة المعاملات / Transactions Page
- الخزينة (Till)
- الكاشير (Cashier)
- الحالة (Status)
- مدفوع / غير مدفوع (Paid/Unpaid)
- التاريخ (Date)

### 5. الإحصائيات / Statistics
- المبيعات (SALES)
- المعاملات (TRANSACTIONS)
- العناصر (ITEMS)
- المنتجات (PRODUCTS)
- إجمالي الربح (TOTAL PROFIT)

## المصطلحات المستخدمة / Terms Used

| English | العربية |
|---------|---------|
| Products | المنتجات |
| Categories | التصنيفات |
| Transactions | المعاملات |
| Users | المستخدمون |
| Settings | الإعدادات |
| Point of Sale | نقطة البيع |
| Open Tabs | الطلبات المفتوحة |
| Customer | العميل |
| Cashier | الكاشير |
| Till | الخزينة |
| Price | السعر |
| Quantity | الكمية |
| Item | المنتج |
| Barcode | الباركود |
| Username | اسم المستخدم |
| Password | كلمة المرور |
| Login | تسجيل الدخول |
| Paid | مدفوع |
| Unpaid | غير مدفوع |
| Date | التاريخ |
| Sales | المبيعات |
| Profit | الربح |
| Save | حفظ |
| Cancel | إلغاء |
| Delete | حذف |
| Edit | تعديل |
| Add | إضافة |
| Search | بحث |
| Print | طباعة |
| Total | الإجمالي |
| Subtotal | المجموع الفرعي |
| Discount | الخصم |
| Tax/VAT | الضريبة |
| Name | الاسم |
| Description | الوصف |
| Cost | التكلفة |
| Stock | المخزون |
| Category | التصنيف |
| Image | الصورة |
| Status | الحالة |
| Action | الإجراء |
| View | عرض |
| Update | تحديث |
| Confirm | تأكيد |
| Close | إغلاق |
| Currency | العملة |
| Store Name | اسم المتجر |
| Address | العنوان |
| Contact | جهة الاتصال |
| Receipt | الإيصال |
| Invoice | الفاتورة |
| Order | الطلب |
| Payment | الدفع |
| Cash | نقدي |
| Card | بطاقة |
| Change | الباقي |
| Customer Orders | طلبات العملاء |

## ما يحتاج إلى ترجمة يدوية / What Needs Manual Translation

نظرًا لحجم التطبيق الكبير (أكثر من 1000 سطر HTML)، هناك بعض الأجزاء التي تحتاج إلى ترجمة يدوية:

### 1. النماذج والمودالز / Forms and Modals
- نموذج المنتجات (Product Form)
- نموذج التصنيفات (Category Form)  
- نموذج المستخدمين (User Form)
- نموذج الإعدادات (Settings Form)
- نموذج العملاء (Customer Form)

### 2. رسائل التنبيه / Alert Messages
- رسائل النجاح (Success messages)
- رسائل الخطأ (Error messages)
- رسائل التأكيد (Confirmation messages)

### 3. التسميات والعناوين / Labels and Headers
- تسميات الحقول في النماذج
- عناوين الأعمدة في الجداول
- عناوين المودالز

## كيفية إكمال الترجمة / How to Complete Translation

### الطريقة 1: البحث والاستبدال
استخدم البحث والاستبدال في محرر النصوص لترجمة المصطلحات المتكررة:

```javascript
// مثال
"Product" → "المنتج"
"Category" → "التصنيف"
"Save" → "حفظ"
```

### الطريقة 2: ترجمة ملف JavaScript
ابحث في `assets/js/pos.js` عن النصوص الإنجليزية واستبدلها بالعربية.

### الطريقة 3: استخدام نظام ترجمة
يمكنك إنشاء ملف ترجمة JSON منفصل وتحميله ديناميكيًا.

## ملاحظات مهمة / Important Notes

1. **الأرقام والتواريخ**: تبقى بالتنسيق الإنجليزي (LTR)
2. **الباركود والأكواد**: تبقى بالتنسيق الإنجليزي
3. **حقول الأسعار**: محاذاة يسار (LTR)
4. **العملة**: تم تغييرها إلى EGP

## الملفات المعدلة / Modified Files

1. `index.html` - الملف الرئيسي
2. `assets/css/arabic-rtl.css` - ملف CSS الجديد للعربية
3. `assets/js/pos.js` - ملف JavaScript الرئيسي
4. `package.json` - تحديث معلومات التطبيق

## نصائح للترجمة / Translation Tips

1. استخدم مصطلحات متسقة
2. اجعل الترجمة واضحة ومباشرة
3. تأكد من أن RTL يعمل بشكل صحيح
4. اختبر جميع الوظائف بعد الترجمة
5. استخدم خطوط عربية واضحة

## الحصول على المساعدة / Getting Help

إذا كنت بحاجة إلى مساعدة في ترجمة أجزاء معينة، يمكنك:
1. استخدام ترجمة جوجل للمسودة الأولى
2. مراجعة الترجمة مع متحدث عربي
3. الرجوع إلى قائمة المصطلحات أعلاه

---

**تم إنشاؤه بواسطة**: فكرة سوفت وير  
**التاريخ**: نوفمبر 2025

