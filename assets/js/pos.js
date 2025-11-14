let cart = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let allCategories = [];
let allTransactions = [];
let sold = [];
let state = [];
let sold_items = [];
let item;
let auth;
let holdOrder = 0;
let vat = 0;
let perms = null;
let deleteId = 0;
let paymentType = 0;
let receipt = '';
let totalVat = 0;
let subTotal = 0;
let method = '';
let order_index = 0;
let user_index = 0;
let product_index = 0;
let transaction_index;
let host = 'localhost';
let path = require('path');
let port = '8001';
let notiflix = require('notiflix');
let moment = require('moment');
let Swal = require('sweetalert2');
let { ipcRenderer } = require('electron');
let dotInterval = setInterval(function () { $(".dot").text('.') }, 3000);
let Store = require('electron-store');
const remote = require('electron').remote;
const app = remote.app;
let img_path = app.getPath('appData') + '/POS/uploads/';
let api = 'http://' + host + ':' + port + '/api/';
let btoa = require('btoa');
let jsPDF = require('jspdf');
let html2canvas = require('html2canvas');
let JsBarcode = require('jsbarcode');
let macaddress = require('macaddress');
let categories = [];
let holdOrderList = [];
let customerOrderList = [];
let ownUserEdit = null;
let totalPrice = 0;
let orderTotal = 0;
let auth_error = 'اسم المستخدم أو كلمة المرور غير صحيحة';
let auth_empty = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
let holdOrderlocation = $("#randerHoldOrders");
let customerOrderLocation = $("#randerCustomerOrders");
let storage = new Store();
let settings;
let platform;
let user = {};
let start = moment().startOf('month');
let end = moment();
let start_date = moment(start).toDate();
let end_date = moment(end).toDate();
let by_till = 0;
let by_user = 0;
let by_status = 1;

// Helper function to safely get currency symbol
function getCurrencySymbol() {
    return (settings && settings.symbol) ? settings.symbol : '';
}

$(function () {

    function cb(start, end) {
        $('#reportrange span').html(start.format('MMMM D, YYYY') + '  -  ' + end.format('MMMM D, YYYY'));
    }

    $('#reportrange').daterangepicker({
        startDate: start,
        endDate: end,
        autoApply: true,
        timePicker: true,
        timePicker24Hour: true,
        timePickerIncrement: 10,
        timePickerSeconds: true,
        // minDate: '',
        ranges: {
            'Today': [moment().startOf('day'), moment()],
            'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
            'Last 7 Days': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
            'Last 30 Days': [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'This Month': [moment().startOf('month'), moment()],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    }, cb);

    cb(start, end);

});


$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


auth = storage.get('auth');
user = storage.get('user');


if (auth == undefined) {
    $.get(api + 'users/check/', function (data) { });
    $("#loading").show();
    authenticate();

} else {

    $('#loading').show();

    setTimeout(function () {
        $('#loading').hide();
    }, 2000);

    platform = storage.get('settings');

    if (platform != undefined) {

        if (platform.app == 'Network Point of Sale Terminal') {
            api = 'http://' + platform.ip + ':' + port + '/api/';
            perms = true;
        }
    }

    $.get(api + 'users/user/' + user._id, function (data) {
        user = data;
        $('#loggedin-user').text(user.fullname);
    });


    $.get(api + 'settings/get', function (data) {
        settings = data.settings;
    });


    $.get(api + 'users/all', function (users) {
        allUsers = [...users];
    });



    $(document).ready(function () {

        $(".loading").hide();

        loadCategories();
        loadProducts();
        loadCustomers();
        
        // Initialize client features if the function exists
        if (typeof initializeClientFeatures === 'function') {
            setTimeout(function() {
                initializeClientFeatures();
            }, 500);
        }


        if (settings && settings.symbol) {
            $("#price_curr, #payment_curr, #change_curr").text(getCurrencySymbol());
        }


        setTimeout(function () {
            if (settings == undefined && auth != undefined) {
                $('#settingsModal').modal('show');
            }
            else {
                vat = parseFloat(settings.percentage);
                $("#taxInfo").text(settings.charge_tax ? vat : 0);
            }

        }, 1500);



        $("#settingsModal").on("hide.bs.modal", function () {

            setTimeout(function () {
                if (settings == undefined && auth != undefined) {
                    $('#settingsModal').modal('show');
                }
            }, 1000);

        });


        if (0 == user.perm_products) { $(".p_one").hide() };
        if (0 == user.perm_categories) { $(".p_two").hide() };
        if (0 == user.perm_transactions) { $(".p_three").hide() };
        if (0 == user.perm_users) { $(".p_four").hide() };
        if (0 == user.perm_settings) { $(".p_five").hide() };

        function loadProducts() {

            $.get(api + 'inventory/products', function (data) {

                data.forEach(item => {
                    item.price = parseFloat(item.price).toFixed(2);
                });

                allProducts = [...data];
                loadProductList();
                let delay = 0;
                allProducts.forEach(product => {

                    let todayDate = Date.now();
                    let expDate = moment(product.expirationDate, "DD-MM-YYYY");
                    const diffTime = Math.abs(expDate - todayDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 7 && diffDays > 2) {
                        notiflix.Notify.Init({
                            position: "right-bottom",
                            cssAnimationDuration: 600,
                            timeout: 4000 + delay,
                            messageMaxLength: 150,
                            cssAnimationStyle: "from-bottom"
                        });
                        notiflix.Notify.Warning(`${product.name} has only ${diffDays} day(s) left to expiry`);

                    }
                    else if (diffDays <= 2) {
                        notiflix.Notify.Init({
                            position: "right-bottom",
                            cssAnimationDuration: 600,
                            timeout: 8000 + delay * 2,
                            messageMaxLength: 150,
                            cssAnimationStyle: "from-bottom"
                        });
                        notiflix.Notify.Failure(`${product.name} has only ${diffDays} day(s) left to expiry`);
                    }
                    delay += 100;



                })

                $('#parent').text('');
                $('#categories').html(`<button type="button" id="all" class="btn btn-categories btn-white waves-effect waves-light">All</button> `);

                data.forEach(item => {

                    if (!categories.includes(item.category)) {
                        categories.push(item.category);
                    }

                    let item_info = `<div class="col-lg-2 box ${item.category}"
                                onclick="$(this).addToCart(${item._id}, ${item.quantity}, ${item.stock})">
                            <div class="widget-panel widget-style-2 ">                    
                            <div id="image"><img src="${item.img == "" ? "./assets/images/default.jpg" : img_path + item.img}" id="product_img" alt=""></div>                    
                                        <div class="text-muted m-t-5 text-center">
                                        <div class="name" id="product_name">${item.name}</div> 
                                        <span class="sku">${item.sku}</span>
                                        <span class="stock">STOCK </span><span class="count">${item.stock == 1 ? item.quantity : 'N/A'}</span></div>
                                        <sp class="text-success text-center"><b data-plugin="counterup">${item.price + " " + getCurrencySymbol()}</b> </sp>
                            </div>
                        </div>`;
                    $('#parent').append(item_info);
                });

                categories.forEach(category => {

                    let c = allCategories.filter(function (ctg) {
                        return ctg._id == category;
                    })

                    $('#categories').append(`<button type="button" id="${category}" class="btn btn-categories btn-white waves-effect waves-light">${c.length > 0 ? c[0].name : ''}</button> `);
                });
                //possible alert position 
            });

        }

        function loadCategories() {
            $.get(api + 'categories/all', function (data) {
                allCategories = data;
                loadCategoryList();
                $('#category').html(`<option value="0">Select</option>`);
                allCategories.forEach(category => {
                    $('#category').append(`<option value="${category._id}">${category.name}</option>`);
                });
            });
        }


        function loadCustomers() {

            $.get(api + 'customers/all', function (customers) {

                $('#customer').html(`<option value="0" selected="selected">عميل عابر</option>`);

                customers.forEach(cust => {

                    let customer = `<option value='{"id": ${cust._id}, "name": "${cust.name}"}'>${cust.name}</option>`;
                    $('#customer').append(customer);
                });

                //  $('#customer').chosen();

            });

        }


        $.fn.addToCart = function (id, count, stock) {

            if (stock == 1) {
                if (count > 0) {
                    $.get(api + 'inventory/product/' + id, function (data) {
                        $(this).addProductToCart(data);
                    });
                }
                else {
                    Swal.fire(
                        'Out of stock!',
                        'This item is currently unavailable',
                        'info'
                    );
                }
            }
            else {
                $.get(api + 'inventory/product/' + id, function (data) {
                    $(this).addProductToCart(data);
                });
            }

        };


        function barcodeSearch(e) {

            e.preventDefault();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
                $('<i>', { class: 'fa fa-spinner fa-spin' })
            );

            let req = {
                skuCode: $("#skuCode").val()
            }

            $.ajax({
                url: api + 'inventory/product/sku',
                type: 'POST',
                data: JSON.stringify(req),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {
                    if (data._id != undefined && data.quantity >= 1) {
                        $(this).addProductToCart(data);
                        $("#searchBarCode").get(0).reset();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-ok' })
                        )
                    }
                    else if (data.quantity < 1) {
                        Swal.fire(
                            'Out of stock!',
                            'This item is currently unavailable',
                            'info'
                        );
                    }
                    else {

                        Swal.fire(
                            'Not Found!',
                            '<b>' + $("#skuCode").val() + '</b> is not a valid barcode!',
                            'warning'
                        );

                        $("#searchBarCode").get(0).reset();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-ok' })
                        )
                    }

                }, error: function (data) {
                    if (data.status === 422) {
                        $(this).showValidationError(data);
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-remove' })
                        )
                    }
                    else if (data.status === 404) {
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-remove' })
                        )
                    }
                    else {
                        $(this).showServerError();
                        $("#basic-addon2").empty();
                        $("#basic-addon2").append(
                            $('<i>', { class: 'glyphicon glyphicon-warning-sign' })
                        )
                    }
                }
            });

        }


        $("#searchBarCode").on('submit', function (e) {
            barcodeSearch(e);
        });



        $('body').on('click', '#jq-keyboard button', function (e) {
            let pressed = $(this)[0].className.split(" ");
            if ($("#skuCode").val() != "" && pressed[2] == "enter") {
                barcodeSearch(e);
            }
        });



        $.fn.addProductToCart = function (data) {
            item = {
                id: data._id,
                product_name: data.name,
                sku: data.sku,
                profit: data.profit,
                price: data.price,
                quantity: 1
            };

            if ($(this).isExist(item)) {
                $(this).qtIncrement(index);
            } else {
                cart.push(item);
                $(this).renderTable(cart)
            }
        }


        $.fn.isExist = function (data) {
            let toReturn = false;
            $.each(cart, function (index, value) {
                if (value.id == data.id) {
                    $(this).setIndex(index);
                    toReturn = true;
                }
            });
            return toReturn;
        }


        $.fn.setIndex = function (value) {
            index = value;
        }


        $.fn.calculateCart = function () {
            let total = 0;
            let ctotalProfit = 0;
            let grossTotal;
            $('#total').text(cart.length);
            $.each(cart, function (index, data) {
                total += data.quantity * data.price;
                ctotalProfit += data.quantity * data.profit;
            });

            subTotal = total; // Store subtotal before discount
            
            // Apply discount
            let discount = parseFloat($("#inputDiscount").val()) || 0;
            
            if (discount >= total) {
                $("#inputDiscount").val(0);
                discount = 0;
            }
            
            // Calculate total after discount
            total = total - discount;

            $('#price').text(total.toFixed(2) + " " + getCurrencySymbol());

            if (settings.charge_tax) {
                totalVat = ((total * vat) / 100);
                grossTotal = total + totalVat
            }

            else {
                grossTotal = total;
            }

            orderTotal = total; // This is now the total AFTER discount

            // $("#gross_price").text(grossTotal.toFixed(2) + " " + getCurrencySymbol());
            $("#payablePrice").val(total);
        };



        $.fn.renderTable = function (cartList) {
            $('#cartTable > tbody').empty();
            $(this).calculateCart();
            $.each(cartList, function (index, data) {
                $('#cartTable > tbody').append(
                    $('<tr>').append(
                        $('<td>', { text: index + 1 }),
                        $('<td>', { text: data.product_name }),
                        $('<td>').append(
                            $('<div>', { class: 'input-group' }).append(
                                $('<div>', { class: 'input-group-btn btn-xs' }).append(
                                    $('<button>', {
                                        class: 'btn btn-default btn-xs',
                                        onclick: '$(this).qtDecrement(' + index + ')'
                                    }).append(
                                        $('<i>', { class: 'fa fa-minus' })
                                    )
                                ),
                                $('<input>', {
                                    class: 'form-control',
                                    type: 'number',
                                    value: data.quantity,
                                    onInput: '$(this).qtInput(' + index + ')'
                                }),
                                $('<div>', { class: 'input-group-btn btn-xs' }).append(
                                    $('<button>', {
                                        class: 'btn btn-default btn-xs',
                                        onclick: '$(this).qtIncrement(' + index + ')'
                                    }).append(
                                        $('<i>', { class: 'fa fa-plus' })
                                    )
                                )
                            )
                        ),
                        $('<td>', { text: (data.price * data.quantity).toFixed(2) }), //+ settings.symbol 
                        $('<td>').append(
                            $('<button>', {
                                class: 'btn btn-danger btn-xs',
                                onclick: '$(this).deleteFromCart(' + index + ')'
                            }).append(
                                $('<i>', { class: 'fa fa-times' })
                            )
                        )
                    )
                )
            })
        };


        $.fn.deleteFromCart = function (index) {
            cart.splice(index, 1);
            $(this).renderTable(cart);

        }


        $.fn.qtIncrement = function (i) {

            item = cart[i];

            let product = allProducts.filter(function (selected) {
                return selected._id == parseInt(item.id);
            });

            if (product[0].stock == 1) {
                if (item.quantity < product[0].quantity) {
                    item.quantity += 1;
                    $(this).renderTable(cart);
                }

                else {
                    Swal.fire(
                        'No more stock!',
                        'You have already added all the available stock.',
                        'info'
                    );
                }
            }
            else {
                item.quantity += 1;
                $(this).renderTable(cart);
            }

        }


        $.fn.qtDecrement = function (i) {
            if (item.quantity > 1) {
                item = cart[i];
                item.quantity -= 1;
                $(this).renderTable(cart);
            }
        }


        $.fn.qtInput = function (i) {
            item = cart[i];
            item.quantity = $(this).val();
            $(this).renderTable(cart);
        }


        $.fn.cancelOrder = function () {

            if (cart.length > 0) {
                Swal.fire({
                    title: 'هل أنت متأكد؟',
                    text: "أنت على وشك إزالة جميع العناصر من السلة.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, clear it!'
                }).then((result) => {

                    if (result.value) {

                        cart = [];
                        $(this).renderTable(cart);
                        holdOrder = 0;

                        Swal.fire(
                            'Cleared!',
                            'All items have been removed.',
                            'success'
                        )
                    }
                });
            }

        }


        $("#payButton").on('click', function () {
            if (cart.length != 0) {
                $("#paymentModel").modal('toggle');
            } else {
                Swal.fire(
                    'Oops!',
                    'There is nothing to pay!',
                    'warning'
                );
            }

        });


        $("#hold").on('click', function () {

            if (cart.length != 0) {

                $("#dueModal").modal('toggle');
            } else {
                Swal.fire(
                    'Oops!',
                    'There is nothing to hold!',
                    'warning'
                );
            }
        });


        function printJobComplete() {
            alert("print job complete");
        }


        $.fn.submitDueOrder = function (status) {

            let items = "";
            let payment = 0;

            cart.forEach(item => {

                items += "<tr><td>" + item.product_name + "</td><td>" + item.quantity + "</td><td>" + parseFloat(item.price).toFixed(2) + " " + getCurrencySymbol() + "</td></tr>";

            });

            let currentTime = new Date(moment());

            let discount = parseFloat($("#inputDiscount").val()) || 0;
            let customer = JSON.parse($("#customer").val());
            
            // Get selected client (new feature)
            let client = null;
            if (typeof getSelectedClient === 'function') {
                client = getSelectedClient();
            }
            
            let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
            let paid = $("#payment").val() == "" ? "0" : parseFloat($("#payment").val()).toFixed(2);
            let change = $("#change").text() == "" ? "0" : parseFloat($("#change").text()).toFixed(2);
            let refNumber = $("#refNumber").val();
            let orderNumber = holdOrder;
            let type = "";
            let tax_row = "";
            
            // Determine transaction status based on payment
            let transactionStatus = status;
            let paidAmount = parseFloat(paid);
            let totalAmount = parseFloat(orderTotal);
            
            // If partial payment or pay later, set status to 0 (unpaid/partial)
            if (paidAmount < totalAmount && paidAmount >= 0) {
                transactionStatus = 0;
            } else if (paidAmount >= totalAmount) {
                transactionStatus = 1; // Fully paid
            }


            switch (paymentType) {

                case 1: type = "Cheque";
                    break;

                case 2: type = "Card";
                    break;

                default: type = "Cash";

            }


            if (paid != "" && parseFloat(paid) > 0) {
                let remaining = totalAmount - paidAmount;
                payment = `<tr>
                        <td>Paid</td>
                        <td>:</td>
                        <td>${paid + " " + getCurrencySymbol()}</td>
                    </tr>
                    ${remaining > 0 ? `<tr>
                        <td>Remaining</td>
                        <td>:</td>
                        <td>${remaining.toFixed(2) + " " + getCurrencySymbol()}</td>
                    </tr>` : `<tr>
                        <td>Change</td>
                        <td>:</td>
                        <td>${Math.abs(change).toFixed(2) + " " + getCurrencySymbol()}</td>
                    </tr>`}
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td>${type}</td>
                    </tr>`
            } else if (parseFloat(paid) === 0 && client && client._id !== '0') {
                payment = `<tr>
                        <td colspan="3" style="color: red; text-align: center;"><strong>Pay Later - مدين</strong></td>
                    </tr>
                    <tr>
                        <td>Client</td>
                        <td>:</td>
                        <td>${client.name}</td>
                    </tr>
                    <tr>
                        <td>Amount Due</td>
                        <td>:</td>
                        <td>${totalAmount.toFixed(2) + " " + getCurrencySymbol()}</td>
                    </tr>`
            }



            if (settings.charge_tax) {
                tax_row = `<tr>
                    <td>Vat(${settings.percentage})% </td>
                    <td>:</td>
                    <td>${parseFloat(totalVat).toFixed(2)} ${getCurrencySymbol()}</td>
                </tr>`;
            }



            if (status == 0) {

                if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
                    Swal.fire(
                        'Reference Required!',
                        'You either need to select a customer <br> or enter a reference!',
                        'warning'
                    )

                    return;
                }
            }


            $(".loading").show();


            if (holdOrder != 0) {

                orderNumber = holdOrder;
                method = 'PUT'
            }
            else {
                orderNumber = Math.floor(Date.now() / 1000);
                method = 'POST'
            }


            // Determine client name for receipt
            let clientName = 'عميل عابر';
            if (client && client._id !== '0') {
                clientName = client.name;
            } else if (customer && customer != 0) {
                clientName = customer.name;
            }
            
            receipt = `<div style="font-size: 10px;">                            
        <p style="text-align: center;">
        ${settings.img == "" ? settings.img : '<img style="max-width: 50px;max-width: 100px;" src ="' + img_path + settings.img + '" /><br>'}
            <span style="font-size: 22px;">${settings.store}</span> <br>
            ${settings.address_one} <br>
            ${settings.address_two} <br>
            ${settings.contact != '' ? 'Tel: ' + settings.contact + '<br>' : ''} 
            ${settings.tax != '' ? 'Vat No: ' + settings.tax + '<br>' : ''} 
        </p>
        <hr>
        <left>
            <p>
            رقم الطلب : ${orderNumber} <br>
            الرقم المرجعي : ${refNumber == "" ? orderNumber : refNumber} <br>
            العميل : ${clientName} <br>
            الكاشير : ${user.fullname} <br>
            التاريخ : ${date}<br>
            </p>

        </left>
        <hr>
        <table width="100%">
            <thead style="text-align: left;">
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
            </tr>
            </thead>
            <tbody>
            ${items}                
     
            <tr>                        
                <td><b>Subtotal</b></td>
                <td>:</td>
                <td><b>${subTotal.toFixed(2)} ${getCurrencySymbol()}</b></td>
            </tr>
            <tr>
                <td>Discount</td>
                <td>:</td>
                <td>${discount > 0 ? getCurrencySymbol() + parseFloat(discount).toFixed(2) : ''}</td>
            </tr>
            
            ${tax_row}
        
            <tr>
                <td><h3>Total</h3></td>
                <td><h3>:</h3></td>
                <td>
                    <h3>${parseFloat(orderTotal).toFixed(2)} ${getCurrencySymbol()}</h3>
                </td>
            </tr>
            ${payment == 0 ? '' : payment}
            </tbody>
            </table>
            <br>
            <hr>
            <br>
            <p style="text-align: center;">
             ${settings.footer}
             </p>
            </div>`;


            if (status == 3) {
                if (cart.length > 0) {

                    printJS({ printable: receipt, type: 'raw-html' });

                    $(".loading").hide();
                    return;

                }
                else {

                    $(".loading").hide();
                    return;
                }
            }


            let data = {
                order: orderNumber,
                ref_number: refNumber,
                discount: discount,
                customer: customer,
                client: client,  // New: client information
                status: transactionStatus,  // Updated: use calculated status
                subtotal: parseFloat(subTotal).toFixed(2),
                tax: totalVat,
                order_type: 1,
                items: cart,
                date: currentTime,
                payment_type: paymentType,
                payment_info: $("#paymentInfo").val(),
                total: orderTotal,
                paid: paid,
                change: change,
                _id: orderNumber,
                till: platform ? platform.till : 1,
                mac: platform ? platform.mac : '',
                user: user.fullname,
                user_id: user._id,
                isPartialPayment: paidAmount > 0 && paidAmount < totalAmount,  // New: partial payment flag
                isPayLater: paidAmount === 0 && client && client._id !== '0'  // New: pay later flag
            }


            $.ajax({
                url: api + 'new',
                type: method,
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {
                    
                    // Update client balance if applicable
                    if (client && client._id !== '0' && (paidAmount < totalAmount || paidAmount === 0)) {
                        let purchaseData = {
                            total: totalAmount,
                            paid: paidAmount,
                            transactionId: orderNumber
                        };
                        
                        $.ajax({
                            url: api + 'clients/client/' + client._id + '/purchase',
                            type: 'POST',
                            data: JSON.stringify(purchaseData),
                            contentType: 'application/json',
                            success: function() {
                                // Reload clients to update balances
                                if (typeof loadClients === 'function') {
                                    loadClients();
                                }
                            }
                        });
                    }

                    cart = [];
                    $('#viewTransaction').html('');
                    $('#viewTransaction').html(receipt);
                    $('#orderModal').modal('show');
                    loadProducts();
                    loadCustomers();
                    
                    // Reload clients if the function exists
                    if (typeof loadClients === 'function') {
                        loadClients();
                    }
                    
                    $(".loading").hide();
                    $("#dueModal").modal('hide');
                    $("#paymentModel").modal('hide');
                    $(this).getHoldOrders();
                    $(this).getCustomerOrders();
                    $(this).renderTable(cart);
                    
                    // Reset payment checkboxes
                    $('#partialPayment').prop('checked', false);
                    $('#payLater').prop('checked', false);
                    $('#remainingBalance').hide();

                }, error: function (data) {
                    $(".loading").hide();
                    $("#dueModal").modal('toggle');
                    swal("Something went wrong!", 'Please refresh this page and try again');

                }
            });

            $("#refNumber").val('');
            $("#change").text('');
            $("#payment").val('');
            $("#inputDiscount").val('');

        }


        $.get(api + 'on-hold', function (data) {
            holdOrderList = data;
            holdOrderlocation.empty();
            clearInterval(dotInterval);
            $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
        });


        $.fn.getHoldOrders = function () {
            $.get(api + 'on-hold', function (data) {
                holdOrderList = data;
                clearInterval(dotInterval);
                holdOrderlocation.empty();
                $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
            });
        };


        $.fn.randerHoldOrders = function (data, renderLocation, orderType) {
            $.each(data, function (index, order) {
                $(this).calculatePrice(order);
                renderLocation.append(
                    $('<div>', { class: orderType == 1 ? 'col-md-3 order' : 'col-md-3 customer-order' }).append(
                        $('<a>').append(
                            $('<div>', { class: 'card-box order-box' }).append(
                                $('<p>').append(
                                    $('<b>', { text: 'الرقم المرجعي :' }),
                                    $('<span>', { text: order.ref_number, class: 'ref_number' }),
                                    $('<br>'),
                                    $('<b>', { text: 'السعر :' }),
                                    $('<span>', { text: order.total, class: "label label-info", style: 'font-size:14px;' }),
                                    $('<br>'),
                                    $('<b>', { text: 'العناصر :' }),
                                    $('<span>', { text: order.items.length }),
                                    $('<br>'),
                                    $('<b>', { text: 'العميل :' }),
                                    $('<span>', { text: order.customer != 0 ? order.customer.name : 'عميل عابر', class: 'customer_name' })
                                ),
                                $('<button>', { class: 'btn btn-danger del', onclick: '$(this).deleteOrder(' + index + ',' + orderType + ')' }).append(
                                    $('<i>', { class: 'fa fa-trash' })
                                ),

                                $('<button>', { class: 'btn btn-default', onclick: '$(this).orderDetails(' + index + ',' + orderType + ')' }).append(
                                    $('<span>', { class: 'fa fa-shopping-basket' })
                                )
                            )
                        )
                    )
                )
            })
        }


        $.fn.calculatePrice = function (data) {
            totalPrice = 0;
            $.each(data.products, function (index, product) {
                totalPrice += product.price * product.quantity;
            })

            let vat = (totalPrice * data.vat) / 100;
            totalPrice = ((totalPrice + vat) - data.discount).toFixed(0);

            return totalPrice;
        };


        $.fn.orderDetails = function (index, orderType) {

            $('#refNumber').val('');

            if (orderType == 1) {

                $('#refNumber').val(holdOrderList[index].ref_number);

                $("#customer option:selected").removeAttr('selected');

                $("#customer option").filter(function () {
                    return $(this).text() == "عميل عابر";
                }).prop("selected", true);

                holdOrder = holdOrderList[index]._id;
                cart = [];
                $.each(holdOrderList[index].items, function (index, product) {
                    item = {
                        id: product.id,
                        product_name: product.product_name,
                        sku: product.sku,
                        price: product.price,
                        quantity: product.quantity
                    };
                    cart.push(item);
                })
            } else if (orderType == 2) {

                $('#refNumber').val('');

                $("#customer option:selected").removeAttr('selected');

                $("#customer option").filter(function () {
                    return $(this).text() == customerOrderList[index].customer.name;
                }).prop("selected", true);


                holdOrder = customerOrderList[index]._id;
                cart = [];
                $.each(customerOrderList[index].items, function (index, product) {
                    item = {
                        id: product.id,
                        product_name: product.product_name,
                        sku: product.sku,
                        price: product.price,
                        quantity: product.quantity
                    };
                    cart.push(item);
                })
            }
            $(this).renderTable(cart);
            $("#holdOrdersModal").modal('hide');
            $("#customerModal").modal('hide');
        }


        $.fn.deleteOrder = function (index, type) {

            switch (type) {
                case 1: deleteId = holdOrderList[index]._id;
                    break;
                case 2: deleteId = customerOrderList[index]._id;
            }

            let data = {
                orderId: deleteId,
            }

            Swal.fire({
                title: "Delete order?",
                text: "This will delete the order. Are you sure you want to delete!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'delete',
                        type: 'POST',
                        data: JSON.stringify(data),
                        contentType: 'application/json; charset=utf-8',
                        cache: false,
                        success: function (data) {

                            $(this).getHoldOrders();
                            $(this).getCustomerOrders();

                            Swal.fire(
                                'Deleted!',
                                'You have deleted the order!',
                                'success'
                            )

                        }, error: function (data) {
                            $(".loading").hide();

                        }
                    });
                }
            });
        }



        $.fn.getCustomerOrders = function () {
            $.get(api + 'customer-orders', function (data) {
                clearInterval(dotInterval);
                customerOrderList = data;
                customerOrderLocation.empty();
                $(this).randerHoldOrders(customerOrderList, customerOrderLocation, 2);
            });
        }



        $('#saveCustomer').on('submit', function (e) {

            e.preventDefault();

            let custData = {
                _id: Math.floor(Date.now() / 1000),
                name: $('#userName').val(),
                phone: $('#phoneNumber').val(),
                email: $('#emailAddress').val(),
                address: $('#userAddress').val()
            }

            $.ajax({
                url: api + 'customers/customer',
                type: 'POST',
                data: JSON.stringify(custData),
                contentType: 'application/json; charset=utf-8',
                cache: false,
                processData: false,
                success: function (data) {
                    $("#newCustomer").modal('hide');
                    Swal.fire("Customer added!", "Customer added successfully!", "success");
                    $("#customer option:selected").removeAttr('selected');
                    $('#customer').append(
                        $('<option>', { text: custData.name, value: `{"id": ${custData._id}, "name": ${custData.name}}`, selected: 'selected' })
                    );

                    $('#customer').val(`{"id": ${custData._id}, "name": ${custData.name}}`).trigger('chosen:updated');

                }, error: function (data) {
                    $("#newCustomer").modal('hide');
                    Swal.fire('Error', 'Something went wrong please try again', 'error')
                }
            })
        })


        // Don't hide confirm payment button by default anymore
        // $("#confirmPayment").hide();

        $("#cardInfo").hide();

        $("#payment").on('input', function () {
            $(this).calculateChange();
        });


        $("#confirmPayment").on('click', function () {
            let paymentValue = $('#payment').val();
            let totalValue = parseFloat($('#payablePrice').val());
            let paymentAmount = parseFloat(paymentValue) || 0;
            
            // Check if it's a pay later scenario
            let isPayLaterChecked = $('#payLater').is(':checked');
            let isPartialPaymentChecked = $('#partialPayment').is(':checked');
            let clientId = $('#clientSelect').val();
            
            // Allow pay later if client is selected
            if (isPayLaterChecked && clientId !== '0') {
                $(this).submitDueOrder(1);
                return;
            }
            
            // Allow partial payment if client is selected and amount is greater than 0
            if (isPartialPaymentChecked && clientId !== '0' && paymentAmount > 0 && paymentAmount < totalValue) {
                $(this).submitDueOrder(1);
                return;
            }
            
            // Original validation for full payment
            if (paymentValue == "" || paymentAmount === 0) {
                Swal.fire(
                    'تحذير!',
                    'الرجاء إدخال المبلغ المدفوع أو اختيار دفع لاحق!',
                    'warning'
                );
            }
            else {
                $(this).submitDueOrder(1);
            }
        });


        $('#transactions').click(function () {
            loadTransactions();
            loadUserList();

            $('#pos_view').hide();
            $('#pointofsale').show();
            $('#transactions_view').show();
            $(this).hide();

        });


        $('#pointofsale').click(function () {
            $('#pos_view').show();
            $('#transactions').show();
            $('#transactions_view').hide();
            $(this).hide();
        });


        $("#viewRefOrders").click(function () {
            setTimeout(function () {
                $("#holdOrderInput").focus();
            }, 500);
        });


        $("#viewCustomerOrders").click(function () {
            setTimeout(function () {
                $("#holdCustomerOrderInput").focus();
            }, 500);
        });


        $('#newProductModal').click(function () {
            $('#saveProduct').get(0).reset();
            $('#current_img').text('');
        });


        $('#saveProduct').submit(function (e) {
            e.preventDefault();

            $(this).attr('action', api + 'inventory/product');
            $(this).attr('method', 'POST');

            $(this).ajaxSubmit({
                contentType: 'application/json',
                success: function (response) {

                    $('#saveProduct').get(0).reset();
                    $('#current_img').text('');

                    loadProducts();
                    Swal.fire({
                        title: 'Product Saved',
                        text: "Select an option below to continue.",
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Add another',
                        cancelButtonText: 'Close'
                    }).then((result) => {

                        if (!result.value) {
                            $("#newProduct").modal('hide');
                        }
                    });
                }, error: function (data) {
                    console.log(data);
                }
            });

        });



        $('#saveCategory').submit(function (e) {
            e.preventDefault();

            if ($('#category_id').val() == "") {
                method = 'POST';
            }
            else {
                method = 'PUT';
            }

            $.ajax({
                type: method,
                url: api + 'categories/category',
                data: $(this).serialize(),
                success: function (data, textStatus, jqXHR) {
                    $('#saveCategory').get(0).reset();
                    loadCategories();
                    loadProducts();
                    Swal.fire({
                        title: 'Category Saved',
                        text: "Select an option below to continue.",
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Add another',
                        cancelButtonText: 'Close'
                    }).then((result) => {

                        if (!result.value) {
                            $("#newCategory").modal('hide');
                        }
                    });
                }, error: function (data) {
                    console.log(data);
                }

            });


        });


        $.fn.editProduct = function (index) {

            $('#Products').modal('hide');

            $("#category option").filter(function () {
                return $(this).val() == allProducts[index].category;
            }).prop("selected", true);
            $('#barcode').val(allProducts[index].barcode);
            $('#productName').val(allProducts[index].name);
            $('#product_price').val(allProducts[index].price);
            $('#quantity').val(allProducts[index].quantity);
            $('#profit').val(allProducts[index].profit);
            $('#expirationDate').val(allProducts[index].expirationDate);
            $('#product_id').val(allProducts[index]._id);
            $('#img').val(allProducts[index].img);

            if (allProducts[index].img != "") {

                $('#imagename').hide();
                $('#current_img').html(`<img src="${img_path + allProducts[index].img}" alt="">`);
                $('#rmv_img').show();
            }

            if (allProducts[index].stock == 0) {
                $('#stock').prop("checked", true);
            }

            $('#newProduct').modal('show');
        }


        $("#userModal").on("hide.bs.modal", function () {
            $('.perms').hide();
        });


        $.fn.editUser = function (index) {

            user_index = index;

            $('#Users').modal('hide');

            $('.perms').show();

            $("#user_id").val(allUsers[index]._id);
            $('#fullname').val(allUsers[index].fullname);
            $('#username').val(allUsers[index].username);
            $('#password').val(atob(allUsers[index].password));

            if (allUsers[index].perm_products == 1) {
                $('#perm_products').prop("checked", true);
            }
            else {
                $('#perm_products').prop("checked", false);
            }

            if (allUsers[index].perm_categories == 1) {
                $('#perm_categories').prop("checked", true);
            }
            else {
                $('#perm_categories').prop("checked", false);
            }

            if (allUsers[index].perm_transactions == 1) {
                $('#perm_transactions').prop("checked", true);
            }
            else {
                $('#perm_transactions').prop("checked", false);
            }

            if (allUsers[index].perm_users == 1) {
                $('#perm_users').prop("checked", true);
            }
            else {
                $('#perm_users').prop("checked", false);
            }

            if (allUsers[index].perm_settings == 1) {
                $('#perm_settings').prop("checked", true);
            }
            else {
                $('#perm_settings').prop("checked", false);
            }

            $('#userModal').modal('show');
        }


        $.fn.editCategory = function (index) {
            $('#Categories').modal('hide');
            $('#categoryName').val(allCategories[index].name);
            $('#category_id').val(allCategories[index]._id);
            $('#newCategory').modal('show');
        }


        $.fn.deleteProduct = function (id) {
            Swal.fire({
                title: 'هل أنت متأكد؟',
                text: "أنت على وشك حذف هذا المنتج.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'نعم، احذفه!',
                cancelButtonText: 'إلغاء'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'inventory/product/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadProducts();
                            Swal.fire(
                                'Done!',
                                'Product deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $.fn.deleteUser = function (id) {
            Swal.fire({
                title: 'هل أنت متأكد؟',
                text: "أنت على وشك حذف هذا المستخدم.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'نعم، احذفه!',
                cancelButtonText: 'إلغاء'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'users/user/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadUserList();
                            Swal.fire(
                                'Done!',
                                'User deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $.fn.deleteCategory = function (id) {
            Swal.fire({
                title: 'هل أنت متأكد؟',
                text: "أنت على وشك حذف هذا التصنيف.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'نعم، احذفه!',
                cancelButtonText: 'إلغاء'
            }).then((result) => {

                if (result.value) {

                    $.ajax({
                        url: api + 'categories/category/' + id,
                        type: 'DELETE',
                        success: function (result) {
                            loadCategories();
                            Swal.fire(
                                'Done!',
                                'Category deleted',
                                'success'
                            );

                        }
                    });
                }
            });
        }


        $('#productModal').click(function () {
            loadProductList();
        });


        $('#usersModal').click(function () {
            loadUserList();
        });


        $('#categoryModal').click(function () {
            loadCategoryList();
        });


        function loadUserList() {

            let counter = 0;
            let user_list = '';
            $('#user_list').empty();
            $('#userList').DataTable().destroy();

            $.get(api + 'users/all', function (users) {



                allUsers = [...users];

                users.forEach((user, index) => {

                    state = [];
                    let class_name = '';

                    if (user.status != "") {
                        state = user.status.split("_");

                        switch (state[0]) {
                            case 'Logged In': class_name = 'btn-default';
                                break;
                            case 'Logged Out': class_name = 'btn-light';
                                break;
                        }
                    }

                    counter++;
                    user_list += `<tr>
            <td>${user.fullname}</td>
            <td>${user.username}</td>
            <td class="${class_name}">${state.length > 0 ? state[0] : ''} <br><span style="font-size: 11px;"> ${state.length > 0 && state[1] ? moment(new Date(state[1])).format('hh:mm A DD MMM YYYY') : ''}</span></td>
            <td>${user._id == 1 ? '<span class="btn-group"><button class="btn btn-dark"><i class="fa fa-edit"></i></button><button class="btn btn-dark"><i class="fa fa-trash"></i></button></span>' : '<span class="btn-group"><button onClick="$(this).editUser(' + index + ')" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteUser(' + user._id + ')" class="btn btn-danger"><i class="fa fa-trash"></i></button></span>'}</td></tr>`;

                    if (counter == users.length) {

                        $('#user_list').html(user_list);

                        $('#userList').DataTable({
                            "order": [[1, "desc"]]
                            , "autoWidth": false
                            , "info": true
                            , "JQueryUI": true
                            , "ordering": true
                            , "paging": false
                        });
                    }

                });

            });
        }


        function loadProductList() {
            let products = [...allProducts];
            let product_list = '';
            let counter = 0;
            $('#product_list').empty();
            $('#productList').DataTable().destroy();
            let delay = 0;
            products.forEach((product, index) => {

                counter++;

                let category = allCategories.filter(function (category) {
                    return category._id == product.category;
                });



                product_list += `<tr>
            <td><img id="`+ product._id + `"></td>
            <td><img style="max-height: 50px; max-width: 50px; border: 1px solid #ddd;" src="${product.img == "" ? "./assets/images/default.jpg" : img_path + product.img}" id="product_img"></td>
            <td>${product.name}</td>
            <td>${product.price} ${settings ? settings.symbol : ''}</td>
            <td>${product.stock == 1 ? product.quantity : 'N/A'}</td>
            <td>${category.length > 0 ? category[0].name : ''}</td>
            <td class="nobr"><span class="btn-group"><button onClick="$(this).editProduct(${index})" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct(${product._id})" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;

                if (counter == allProducts.length) {

                    $('#product_list').html(product_list);

                    products.forEach(pro => {
                        $("#" + pro._id + "").JsBarcode(pro.barcode, {
                            width: 2,
                            height: 25,
                            fontSize: 14
                        });
                    });

                    $('#productList').DataTable({
                        "order": [[1, "desc"]]
                        , "autoWidth": false
                        , "info": true
                        , "JQueryUI": true
                        , "ordering": true
                        , "paging": false
                    });
                }

            });
        }


        function loadCategoryList() {
            let products = [...allProducts];
            let category_list = '';
            let counter = 0;
            $('#category_list').empty();
            $('#categoryList').DataTable().destroy();

            allCategories.forEach((category, index) => {

                counter++;
                category_list += `<tr>
     
            <td>${category.name}</td>
            <td><span class="btn-group"><button onClick="$(this).editCategory(${index})" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteCategory(${category._id})" class="btn btn-danger"><i class="fa fa-trash"></i></button></span></td></tr>`;
            });

            if (counter == allCategories.length) {
                //------------------------------------------




                //----------------------------------------
                $('#category_list').html(category_list);
                $('#categoryList').DataTable({
                    "autoWidth": false
                    , "info": true
                    , "JQueryUI": true
                    , "ordering": true
                    , "paging": false

                });
            }
        }


        $.fn.serializeObject = function () {
            var o = {};
            var a = this.serializeArray();
            $.each(a, function () {
                if (o[this.name]) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        };



        $('#log-out').click(function () {

            Swal.fire({
                title: 'هل أنت متأكد؟',
                text: "أنت على وشك تسجيل الخروج.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'تسجيل الخروج',
                cancelButtonText: 'إلغاء'
            }).then((result) => {

                if (result.value) {
                    $.get(api + 'users/logout/' + user._id, function (data) {
                        storage.delete('auth');
                        storage.delete('user');
                        ipcRenderer.send('app-reload', '');
                    });
                }
            });
        });



        $('#settings_form').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();
            let mac_address;

            api = 'http://' + host + ':' + port + '/api/';

            macaddress.one(function (err, mac) {
                mac_address = mac;
            });

            formData['app'] = $('#app').find('option:selected').text();
            formData['mac'] = mac_address;
            formData['till'] = 1;

            $('#settings_form').append('<input type="hidden" name="app" value="' + formData.app + '" />');

            if (formData.percentage != "" && !$.isNumeric(formData.percentage)) {
                Swal.fire(
                    'Oops!',
                    'Please make sure the tax value is a number',
                    'warning'
                );
            }
            else {
                storage.set('settings', formData);

                $(this).attr('action', api + 'settings/post');
                $(this).attr('method', 'POST');


                $(this).ajaxSubmit({
                    contentType: 'application/json',
                    success: function (response) {

                        ipcRenderer.send('app-reload', '');

                    }, error: function (data) {
                        console.log(data);
                    }

                });

            }

        });



        $('#net_settings_form').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();

            if (formData.till == 0 || formData.till == 1) {
                Swal.fire(
                    'Oops!',
                    'Please enter a number greater than 1.',
                    'warning'
                );
            }
            else {
                if (isNumeric(formData.till)) {
                    formData['app'] = $('#app').find('option:selected').text();
                    storage.set('settings', formData);
                    ipcRenderer.send('app-reload', '');
                }
                else {
                    Swal.fire(
                        'Oops!',
                        'Till number must be a number!',
                        'warning'
                    );
                }

            }

        });



        $('#saveUser').on('submit', function (e) {
            e.preventDefault();
            let formData = $(this).serializeObject();


            if (ownUserEdit) {
                if (formData.password != atob(user.password)) {
                    if (formData.password != formData.pass) {
                        Swal.fire(
                            'Oops!',
                            'Passwords do not match!',
                            'warning'
                        );
                    }
                }
            }
            else {
                if (formData.password != atob(allUsers[user_index].password)) {
                    if (formData.password != formData.pass) {
                        Swal.fire(
                            'Oops!',
                            'Passwords do not match!',
                            'warning'
                        );
                    }
                }
            }



            if (formData.password == atob(user.password) || formData.password == atob(allUsers[user_index].password) || formData.password == formData.pass) {
                $.ajax({
                    url: api + 'users/post',
                    type: 'POST',
                    data: JSON.stringify(formData),
                    contentType: 'application/json; charset=utf-8',
                    cache: false,
                    processData: false,
                    success: function (data) {

                        if (ownUserEdit) {
                            ipcRenderer.send('app-reload', '');
                        }

                        else {
                            $('#userModal').modal('hide');

                            loadUserList();

                            $('#Users').modal('show');
                            Swal.fire(
                                'Ok!',
                                'User details saved!',
                                'success'
                            );
                        }


                    }, error: function (data) {

                    }

                });

            }

        });



        $('#app').change(function () {
            if ($(this).find('option:selected').text() == 'Network Point of Sale Terminal') {
                $('#net_settings_form').show(500);
                $('#settings_form').hide(500);
                macaddress.one(function (err, mac) {
                    $("#mac").val(mac);
                });
            }
            else {
                $('#net_settings_form').hide(500);
                $('#settings_form').show(500);
            }

        });



        $('#cashier').click(function () {

            ownUserEdit = true;

            $('#userModal').modal('show');

            $("#user_id").val(user._id);
            $("#fullname").val(user.fullname);
            $("#username").val(user.username);
            $("#password").val(atob(user.password));

        });



        $('#add-user').click(function () {

            if (platform.app != 'Network Point of Sale Terminal') {
                $('.perms').show();
            }

            $("#saveUser").get(0).reset();
            $('#userModal').modal('show');

        });



        $('#settings').click(function () {

            if (platform.app == 'Network Point of Sale Terminal') {
                $('#net_settings_form').show(500);
                $('#settings_form').hide(500);

                $("#ip").val(platform.ip);
                $("#till").val(platform.till);

                macaddress.one(function (err, mac) {
                    $("#mac").val(mac);
                });

                $("#app option").filter(function () {
                    return $(this).text() == platform.app;
                }).prop("selected", true);
            }
            else {
                $('#net_settings_form').hide(500);
                $('#settings_form').show(500);

                $("#settings_id").val("1");
                $("#store").val(settings.store);
                $("#address_one").val(settings.address_one);
                $("#address_two").val(settings.address_two);
                $("#contact").val(settings.contact);
                $("#tax").val(settings.tax);
                $("#symbol").val(settings.symbol);
                $("#percentage").val(settings.percentage);
                $("#footer").val(settings.footer);
                $("#logo_img").val(settings.img);
                if (settings.charge_tax == 'on') {
                    $('#charge_tax').prop("checked", true);
                }
                if (settings.img != "") {
                    $('#logoname').hide();
                    $('#current_logo').html(`<img src="${img_path + settings.img}" alt="">`);
                    $('#rmv_logo').show();
                }

                $("#app option").filter(function () {
                    return $(this).text() == settings.app;
                }).prop("selected", true);
            }




        });


    });


    $('#rmv_logo').click(function () {
        $('#remove_logo').val("1");
        $('#current_logo').hide(500);
        $(this).hide(500);
        $('#logoname').show(500);
    });


    $('#rmv_img').click(function () {
        $('#remove_img').val("1");
        $('#current_img').hide(500);
        $(this).hide(500);
        $('#imagename').show(500);
    });


    $('#print_list').click(function () {

        $("#loading").show();

        $('#productList').DataTable().destroy();

        const filename = 'productList.pdf';

        html2canvas($('#all_products').get(0)).then(canvas => {
            let height = canvas.height * (25.4 / 96);
            let width = canvas.width * (25.4 / 96);
            let pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);

            $("#loading").hide();
            pdf.save(filename);
        });



        $('#productList').DataTable({
            "order": [[1, "desc"]]
            , "autoWidth": false
            , "info": true
            , "JQueryUI": true
            , "ordering": true
            , "paging": false
        });

        $(".loading").hide();

    });

}


$.fn.print = function () {

    printJS({ printable: receipt, type: 'raw-html' });

}


function loadTransactions() {

    let tills = [];
    let users = [];
    let sales = 0;
    let subProfit = 0;
    let totalProfit = 0;
    let transact = 0;
    let unique = 0;

    sold_items = [];
    sold = [];

    let counter = 0;
    let transaction_list = '';
    let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;


    $.get(api + query, function (transactions) {

        if (transactions.length > 0) {


            $('#transaction_list').empty();
            $('#transactionList').DataTable().destroy();
            // here the trans data 
            allTransactions = [...transactions];

            transactions.forEach((trans, index) => {
                sales += parseFloat(trans.total);


                transact++;



                trans.items.forEach(item => {
                    subProfit += item.profit * item.quantity;

                    sold_items.push(item);
                });
                totalProfit += subProfit;


                if (!tills.includes(trans.till)) {
                    tills.push(trans.till);
                }

                if (!users.includes(trans.user_id)) {
                    users.push(trans.user_id);
                }

                counter++;
                transaction_list += `<tr>
                                <td>${trans.order}</td>
                                <td class="nobr">${moment(trans.date).format('YYYY MMM DD hh:mm:ss')}</td>
                                <td>${trans.total + " " + getCurrencySymbol()}</td>
                                <td>${trans.paid == "" ? "" : trans.paid + " " + getCurrencySymbol()}</td>
                                <td>${trans.change ? Math.abs(trans.change).toFixed(2) + " " + getCurrencySymbol() : ''}</td>
                                <td>${trans.paid == "" ? "" : trans.payment_type == 0 ? "Cash" : 'Card'}</td>
                                <td>${subProfit + " " + getCurrencySymbol()}</td>
                                <td>${trans.user}</td>
                                <td>${trans.paid == "" ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>' : '<button onClick="$(this).viewTransaction(' + index + ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'}</tr>
                    `;
                subProfit = 0;
                if (counter == transactions.length) {

                    $('#total_sales #counter').text(parseFloat(sales).toFixed(2) + " " + getCurrencySymbol());
                    $('#total_transactions #counter').text(transact);
                    $('#total_profit #counter').text(totalProfit + " " + getCurrencySymbol());
                    const result = {};

                    for (const { product_name, price, quantity, id } of sold_items) {
                        if (!result[product_name]) result[product_name] = [];
                        result[product_name].push({ id, price, quantity });
                    }

                    for (item in result) {

                        let price = 0;
                        let quantity = 0;
                        let id = 0;

                        result[item].forEach(i => {
                            id = i.id;
                            price = i.price;
                            quantity += i.quantity;
                        });

                        sold.push({
                            id: id,
                            product: item,
                            qty: quantity,
                            price: price
                        });
                    }

                    loadSoldProducts();


                    if (by_user == 0 && by_till == 0) {

                        userFilter(users);
                        tillFilter(tills);
                    }


                    $('#transaction_list').html(transaction_list);
                    $('#transactionList').DataTable({
                        "order": [[1, "desc"]]
                        , "autoWidth": false
                        , "info": true
                        , "JQueryUI": true
                        , "ordering": true
                        , "paging": true
                    });
                }
            });
        }
        else {
            Swal.fire(
                'No data!',
                'No transactions available within the selected criteria',
                'warning'
            );
        }

    });
}


function discend(a, b) {
    if (a.qty > b.qty) {
        return -1;
    }
    if (a.qty < b.qty) {
        return 1;
    }
    return 0;
}


function loadSoldProducts() {

    sold.sort(discend);

    let counter = 0;
    let sold_list = '';
    let items = 0;
    let products = 0;
    $('#product_sales').empty();

    sold.forEach((item, index) => {
        items += item.qty;
        products++;

        let product = allProducts.filter(function (selected) {
            return selected._id == item.id;
        });

        counter++;
        
        // Check if product exists to avoid undefined errors
        let stockDisplay = 'N/A';
        if (product && product.length > 0 && product[0]) {
            stockDisplay = product[0].stock == 1 ? product[0].quantity : 'N/A';
        }

        sold_list += `<tr>
            <td>${item.product}</td>
            <td>${item.qty}</td>
            <td>${stockDisplay}</td>
            <td>${(item.qty * parseFloat(item.price)).toFixed(2) + " " + getCurrencySymbol()}</td>
            </tr>`;

        if (counter == sold.length) {
            $('#total_items #counter').text(items);
            $('#total_products #counter').text(products);
            $('#product_sales').html(sold_list);
        }
    });
}


function userFilter(users) {

    $('#users').empty();
    $('#users').append(`<option value="0">All</option>`);

    users.forEach(user => {
        let u = allUsers.filter(function (usr) {
            return usr._id == user;
        });

        $('#users').append(`<option value="${user}">${u[0].fullname}</option>`);
    });

}


function tillFilter(tills) {

    $('#tills').empty();
    $('#tills').append(`<option value="0">All</option>`);
    tills.forEach(till => {
        $('#tills').append(`<option value="${till}">${till}</option>`);
    });

}


$.fn.viewTransaction = function (index) {

    transaction_index = index;

    let discount = allTransactions[index].discount;
    let customer = allTransactions[index].customer == 0 ? 'عميل عابر' : allTransactions[index].customer.username;
    let refNumber = allTransactions[index].ref_number != "" ? allTransactions[index].ref_number : allTransactions[index].order;
    let orderNumber = allTransactions[index].order;
    let type = "";
    let tax_row = "";
    let items = "";
    let products = allTransactions[index].items;

    products.forEach(item => {
        items += "<tr><td>" + item.product_name + "</td><td>" + item.quantity + "</td><td>" + parseFloat(item.price).toFixed(2) + " " + getCurrencySymbol() + "</td></tr>";

    });


    switch (allTransactions[index].payment_type) {

        case 2: type = "Card";
            break;

        default: type = "Cash";

    }


    if (allTransactions[index].paid != "") {
        payment = `<tr>
                    <td>Paid</td>
                    <td>:</td>
                    <td>${allTransactions[index].paid + " " + getCurrencySymbol()}</td>
                </tr>
                <tr>
                    <td>Change</td>
                    <td>:</td>
                    <td>${Math.abs(allTransactions[index].change).toFixed(2) + " " + getCurrencySymbol()}</td>
                </tr>
                <tr>
                    <td>Method</td>
                    <td>:</td>
                    <td>${type}</td>
                </tr>`
    }



    if (settings.charge_tax) {
        tax_row = `<tr>
                <td>Vat(${settings.percentage})% </td>
                <td>:</td>
                <td>${parseFloat(allTransactions[index].tax).toFixed(2)} ${getCurrencySymbol()}</td>
            </tr>`;
    }



    receipt = `<div style="font-size: 10px;">                            
        <p style="text-align: center;">
        ${settings.img == "" ? settings.img : '<img style="max-width: 50px;max-width: 100px;" src ="' + img_path + settings.img + '" /><br>'}
            <span style="font-size: 22px;">${settings.store}</span> <br>
            ${settings.address_one} <br>
            ${settings.address_two} <br>
            ${settings.contact != '' ? 'Tel: ' + settings.contact + '<br>' : ''} 
            ${settings.tax != '' ? 'Vat No: ' + settings.tax + '<br>' : ''} 
    </p>
    <hr>
    <left>
        <p>
        الفاتورة : ${orderNumber} <br>
        الرقم المرجعي : ${refNumber} <br>
        العميل : ${allTransactions[index].customer == 0 ? 'عميل عابر' : allTransactions[index].customer.name} <br>
        الكاشير : ${allTransactions[index].user} <br>
        التاريخ : ${moment(allTransactions[index].date).format('DD MMM YYYY HH:mm:ss')}<br>
        </p>

    </left>
    <hr>
    <table width="100%">
        <thead style="text-align: left;">
        <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
        </tr>
        </thead>
        <tbody>
        ${items}                
 
        <tr>                        
            <td><b>Subtotal</b></td>
            <td>:</td>
            <td><b>${allTransactions[index].subtotal} ${getCurrencySymbol()}</b></td>
        </tr>
        <tr>
            <td>Discount</td>
            <td>:</td>
            <td>${discount > 0 ? parseFloat(allTransactions[index].discount).toFixed(2) + " " + getCurrencySymbol() : ''}</td>
        </tr>
        
        ${tax_row}
    
        <tr>
            <td><h3>Total</h3></td>
            <td><h3>:</h3></td>
            <td>
                <h3>${allTransactions[index].total} ${getCurrencySymbol()}</h3>
            </td>
        </tr>
        ${payment == 0 ? '' : payment}
        </tbody>
        </table>
        <br>
        <hr>
        <br>
        <p style="text-align: center;">
         ${settings.footer}
         </p>
        </div>`;

    $('#viewTransaction').html('');
    $('#viewTransaction').html(receipt);

    $('#orderModal').modal('show');

}


$('#status').change(function () {
    by_status = $(this).find('option:selected').val();
    loadTransactions();
});



$('#tills').change(function () {
    by_till = $(this).find('option:selected').val();
    loadTransactions();
});


$('#users').change(function () {
    by_user = $(this).find('option:selected').val();
    loadTransactions();
});


$('#reportrange').on('apply.daterangepicker', function (ev, picker) {

    start = picker.startDate.format('DD MMM YYYY hh:mm A');
    end = picker.endDate.format('DD MMM YYYY hh:mm A');

    start_date = picker.startDate.toDate().toJSON();
    end_date = picker.endDate.toDate().toJSON();


    loadTransactions();
});


function authenticate() {
    $('#loading').append(
        `<div id="load">
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="assets/images/fikra-logo.png" alt="فكرة سوفت وير" style="max-width: 200px; margin-bottom: 20px;">
            <h2 style="color: #08C7E3; margin: 0;">فكرة سوفت وير</h2>
            <p style="color: #aaa; margin: 5px 0;">نظام نقطة البيع</p>
        </div>
        <form id="account">
            <div class="form-group"><input type="text" placeholder="اسم المستخدم" name="username" class="form-control"></div>
            <div class="form-group"><input type="password" placeholder="كلمة المرور" name="password" class="form-control"></div>
            <div class="form-group"><input type="submit" class="btn btn-block btn-default" value="تسجيل الدخول"></div>
        </form></div>`
    );
}


$('body').on("submit", "#account", function (e) {
    e.preventDefault();
    let formData = $(this).serializeObject();

    if (formData.username == "" || formData.password == "") {

        Swal.fire(
            'Incomplete form!',
            auth_empty,
            'warning'
        );
    }
    else {

        $.ajax({
            url: api + 'users/login',
            type: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json; charset=utf-8',
            cache: false,
            processData: false,
            success: function (data) {
                if (data._id) {
                    storage.set('auth', { auth: true });
                    storage.set('user', data);
                    ipcRenderer.send('app-reload', '');
                }
                else {
                    Swal.fire(
                        'Oops!',
                        auth_error,
                        'warning'
                    );
                }

            }, error: function (data) {
                console.log(data);
            }
        });
    }
});


$('#quit').click(function () {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: "أنت على وشك إغلاق التطبيق.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، أغلق',
        cancelButtonText: 'إلغاء'
    }).then((result) => {

        if (result.value) {
            ipcRenderer.send('app-quit', '');
        }
    });
});


// ==================== CLIENT MANAGEMENT FEATURES ====================
// Client Management functionality for partial payments and pay later

let allClients = [];
let selectedClient = null;
let isPartialPayment = false;
let isPayLater = false;

// Load all clients
function loadClients() {
    $.get(api + 'clients/all', function (clients) {
        allClients = clients;
        
        // Populate client select dropdown
        updateClientSelectDropdown();
        
        // Load client list in modal
        loadClientList();
    });
}

// Update client select dropdown
function updateClientSelectDropdown(filteredClients = null) {
    let clientsToShow = filteredClients || allClients;
    
    $('#clientSelect').html(`<option value="0">عميل عابر (Walk-in Customer)</option>`);
    
    clientsToShow.forEach(client => {
        let balanceIndicator = client.balance > 0 ? ` (مستحق: ${client.balance.toFixed(2)})` : '';
        $('#clientSelect').append(`<option value="${client._id}">${client.name}${balanceIndicator}</option>`);
    });
}

// Search clients in POS dropdown
$('#clientSearchInput').on('input', function() {
    let searchTerm = $(this).val().toLowerCase();
    
    if (searchTerm === '') {
        updateClientSelectDropdown();
        return;
    }
    
    let filteredClients = allClients.filter(client => {
        let name = (client.name || '').toLowerCase();
        let phone = (client.phone || '').toLowerCase();
        
        return name.includes(searchTerm) || phone.includes(searchTerm);
    });
    
    updateClientSelectDropdown(filteredClients);
    
    // Auto-select if only one result
    if (filteredClients.length === 1) {
        $('#clientSelect').val(filteredClients[0]._id);
    }
});

// Clear search when client is selected
$('#clientSelect').on('change', function() {
    let selectedId = $(this).val();
    if (selectedId !== '0') {
        let selectedClient = allClients.find(c => c._id === selectedId);
        if (selectedClient) {
            $('#clientSearchInput').val(selectedClient.name);
        }
    } else {
        $('#clientSearchInput').val('');
    }
});

// Focus on client search on Enter key
$('#clientSearchInput').on('keypress', function(e) {
    if (e.which === 13) { // Enter key
        e.preventDefault();
        let filteredOptions = $('#clientSelect option').length;
        if (filteredOptions === 2) { // Walk-in + 1 client
            $('#clientSelect option:eq(1)').prop('selected', true);
            $('#clientSelect').trigger('change');
        }
    }
});

// Load client list table
function loadClientList(filteredClients = null) {
    let clientsToShow = filteredClients || allClients;
    $('#client_list').empty();
    
    if (clientsToShow.length === 0) {
        $('#client_list').append('<tr><td colspan="6" class="text-center">لا يوجد عملاء (No clients found)</td></tr>');
        return;
    }
    
    clientsToShow.forEach((client, index) => {
        let balanceClass = client.balance > 0 ? 'text-danger' : 'text-success';
        let row = $(`
            <tr>
                <td>${client.name}</td>
                <td>${client.phone || '-'}</td>
                <td class="${balanceClass}"><strong>${(client.balance || 0).toFixed(2)} ${getCurrencySymbol()}</strong></td>
                <td>${(client.totalPurchases || 0).toFixed(2)} ${getCurrencySymbol()}</td>
                <td>${(client.totalPaid || 0).toFixed(2)} ${getCurrencySymbol()}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-statement-client" data-client-id="${client._id}">
                        <i class="fa fa-file-text"></i> كشف حساب
                    </button>
                    ${client.balance > 0 ? `<button class="btn btn-sm btn-success btn-pay-client" data-client-id="${client._id}">
                        <i class="fa fa-money"></i> دفع
                    </button>` : ''}
                    <button class="btn btn-sm btn-info btn-view-client" data-client-id="${client._id}">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete-client" data-client-id="${client._id}">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
        $('#client_list').append(row);
    });
    
    // Attach event handlers using event delegation
    $(document).off('click', '.btn-statement-client').on('click', '.btn-statement-client', function() {
        let clientId = $(this).data('client-id');
        showClientStatement(clientId);
    });
    
    $(document).off('click', '.btn-pay-client').on('click', '.btn-pay-client', function() {
        let clientId = $(this).data('client-id');
        openClientPaymentModal(clientId);
    });
    
    $(document).off('click', '.btn-view-client').on('click', '.btn-view-client', function() {
        let clientId = $(this).data('client-id');
        viewClientDetails(clientId);
    });
    
    $(document).off('click', '.btn-delete-client').on('click', '.btn-delete-client', function() {
        let clientId = $(this).data('client-id');
        deleteClient(clientId);
    });
}

// Search clients
$('#searchClients').on('input', function() {
    let searchTerm = $(this).val().toLowerCase();
    
    if (searchTerm === '') {
        loadClientList();
        return;
    }
    
    let filteredClients = allClients.filter(client => {
        let name = (client.name || '').toLowerCase();
        let phone = (client.phone || '').toLowerCase();
        let email = (client.email || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               phone.includes(searchTerm) || 
               email.includes(searchTerm);
    });
    
    loadClientList(filteredClients);
});

// Save new client
$('#saveClient').submit(function (e) {
    e.preventDefault();
    
    let clientData = {
        name: $('#clientName').val(),
        phone: $('#clientPhone').val(),
        email: $('#clientEmail').val(),
        address: $('#clientAddress').val()
    };
    
    $.ajax({
        url: api + 'clients/client',
        type: 'POST',
        data: JSON.stringify(clientData),
        contentType: 'application/json',
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'تم!',
                text: 'تم إضافة العميل بنجاح',
                timer: 2000
            });
            
            $('#newClient').modal('hide');
            $('#saveClient')[0].reset();
            loadClients();
        },
        error: function (error) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ!',
                text: 'حدث خطأ أثناء إضافة العميل'
            });
        }
    });
});

// Open client payment modal
function openClientPaymentModal(clientId) {
    let client = allClients.find(c => c._id === clientId);
    if (!client) return;
    
    $('#clientPaymentId').val(client._id);
    $('#clientPaymentName').text(client.name);
    $('#clientPaymentBalance').text((client.balance || 0).toFixed(2) + ' ' + getCurrencySymbol());
    $('#paymentAmount').val('');
    $('#paymentNote').val('');
    
    $('#clientPaymentModal').modal('show');
}

// Save client payment
$('#saveClientPayment').submit(function (e) {
    e.preventDefault();
    
    let clientId = $('#clientPaymentId').val();
    let amount = parseFloat($('#paymentAmount').val());
    let client = allClients.find(c => c._id === clientId);
    
    if (amount <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'تحذير!',
            text: 'الرجاء إدخال مبلغ صحيح'
        });
        return;
    }
    
    if (amount > client.balance) {
        Swal.fire({
            icon: 'warning',
            title: 'تحذير!',
            text: 'المبلغ المدخل أكبر من الرصيد المستحق',
            showCancelButton: true,
            confirmButtonText: 'متابعة على أي حال',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                submitClientPayment();
            }
        });
    } else {
        submitClientPayment();
    }
});

function submitClientPayment() {
    let paymentData = {
        amount: parseFloat($('#paymentAmount').val()),
        paymentType: $('#paymentTypeClient').val(),
        note: $('#paymentNote').val()
    };
    
    let clientId = $('#clientPaymentId').val();
    
    $.ajax({
        url: api + 'clients/client/' + clientId + '/payment',
        type: 'POST',
        data: JSON.stringify(paymentData),
        contentType: 'application/json',
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'تم!',
                text: 'تم تسجيل الدفع بنجاح',
                timer: 2000
            });
            
            $('#clientPaymentModal').modal('hide');
            loadClients();
        },
        error: function (error) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ!',
                text: 'حدث خطأ أثناء تسجيل الدفع'
            });
        }
    });
}

// View client details
function viewClientDetails(clientId) {
    let client = allClients.find(c => c._id === clientId);
    if (!client) return;
    
    let paymentHistory = '';
    if (client.paymentHistory && client.paymentHistory.length > 0) {
        paymentHistory = '<h4>سجل الدفعات (Payment History):</h4><ul>';
        client.paymentHistory.forEach(payment => {
            paymentHistory += `<li>${moment(payment.date).format('DD/MM/YYYY HH:mm')} - ${payment.amount.toFixed(2)} ${getCurrencySymbol()} (${payment.paymentType})</li>`;
        });
        paymentHistory += '</ul>';
    } else {
        paymentHistory = '<p>لا يوجد سجل دفعات (No payment history)</p>';
    }
    
    Swal.fire({
        title: client.name,
        html: `
            <div style="text-align: right;">
                <p><strong>الهاتف:</strong> ${client.phone || '-'}</p>
                <p><strong>البريد الإلكتروني:</strong> ${client.email || '-'}</p>
                <p><strong>العنوان:</strong> ${client.address || '-'}</p>
                <hr>
                <p><strong>الرصيد المستحق:</strong> <span style="color: ${client.balance > 0 ? 'red' : 'green'}">${(client.balance || 0).toFixed(2)} ${getCurrencySymbol()}</span></p>
                <p><strong>إجمالي المشتريات:</strong> ${(client.totalPurchases || 0).toFixed(2)} ${getCurrencySymbol()}</p>
                <p><strong>إجمالي المدفوع:</strong> ${(client.totalPaid || 0).toFixed(2)} ${getCurrencySymbol()}</p>
                <hr>
                ${paymentHistory}
            </div>
        `,
        width: 600
    });
}

// Delete client
function deleteClient(clientId) {
    let client = allClients.find(c => c._id === clientId);
    
    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: `سيتم حذف العميل: ${client.name}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذف!',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: api + 'clients/client/' + clientId,
                type: 'DELETE',
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'تم الحذف!',
                        text: 'تم حذف العميل بنجاح',
                        timer: 2000
                    });
                    loadClients();
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'خطأ!',
                        text: 'حدث خطأ أثناء حذف العميل'
                    });
                }
            });
        }
    });
}

// Toggle partial payment
function togglePartialPayment() {
    isPartialPayment = $('#partialPayment').is(':checked');
    
    console.log('Partial Payment toggled:', isPartialPayment);
    
    if (isPartialPayment) {
        $('#payLater').prop('checked', false);
        isPayLater = false;
        $('#payment').prop('readonly', false);
        $('#payment').focus();
        $('#remainingBalance').show();
        updateRemainingBalance();
        
        // Check if client is selected
        let clientId = $('#clientSelect').val();
        if (clientId === '0') {
            Swal.fire({
                icon: 'warning',
                title: 'تحذير!',
                text: 'الرجاء اختيار عميل للدفع الجزئي'
            });
            $('#partialPayment').prop('checked', false);
            isPartialPayment = false;
            $('#remainingBalance').hide();
        }
    } else {
        $('#remainingBalance').hide();
    }
}

// Toggle pay later
function togglePayLater() {
    isPayLater = $('#payLater').is(':checked');
    
    console.log('Pay Later toggled:', isPayLater);
    
    if (isPayLater) {
        // Check if client is selected first
        let clientId = $('#clientSelect').val();
        if (clientId === '0') {
            Swal.fire({
                icon: 'warning',
                title: 'تحذير!',
                text: 'الرجاء اختيار عميل للدفع اللاحق'
            });
            $('#payLater').prop('checked', false);
            isPayLater = false;
            $('#payment').prop('readonly', false);
            $('#remainingBalance').hide();
            return;
        }
        
        $('#partialPayment').prop('checked', false);
        isPartialPayment = false;
        $('#payment').val('0');
        $('#payment').prop('readonly', true);
        $('#change').text('0');
        $('#remainingBalance').show();
        
        let total = $('#payablePrice').val();
        $('#remaining').text(total);
        $('#remaining_curr').text(getCurrencySymbol());
        $('#confirmPayment').show();
    } else {
        $('#payment').prop('readonly', false);
        $('#payment').val('');
        $('#remainingBalance').hide();
    }
}

// Update remaining balance display
function updateRemainingBalance() {
    if (isPartialPayment || isPayLater) {
        let total = parseFloat($('#payablePrice').val()) || 0;
        let paid = parseFloat($('#payment').val()) || 0;
        let remaining = total - paid;
        
        $('#remainingBalance').show();
        
        if (remaining > 0) {
            $('#remaining').text(remaining.toFixed(2));
            $('#remaining_curr').text(getCurrencySymbol());
        } else {
            $('#remaining').text('0.00');
        }
    } else {
        $('#remainingBalance').hide();
    }
}

// Initialize currency symbols for remaining balance
function initializeClientFeatures() {
    if (settings && settings.symbol) {
        $('#remaining_curr').text(getCurrencySymbol());
    }
    
    // Load clients on page load
    loadClients();
    
    // Make sure remaining balance is hidden initially
    $('#remainingBalance').hide();
    
    // Update remaining balance when payment input changes
    $(document).on('input', '#payment', function() {
        updateRemainingBalance();
    });
    
    // Initialize the checkbox event handlers
    $(document).on('change', '#partialPayment', togglePartialPayment);
    $(document).on('change', '#payLater', togglePayLater);
}

// Get selected client object
function getSelectedClient() {
    let clientId = $('#clientSelect').val();
    if (clientId === '0') {
        return { _id: '0', name: 'عميل عابر' };
    }
    return allClients.find(c => c._id === clientId) || { _id: '0', name: 'عميل عابر' };
}

// ==================== UNPAID TRANSACTIONS MANAGEMENT ====================

let allUnpaidTransactions = [];

// Load unpaid transactions
function loadUnpaidTransactions() {
    $.get(api + 'unpaid/all', function (transactions) {
        allUnpaidTransactions = transactions;
        renderUnpaidTransactionsList();
    });
}

// Render unpaid transactions list
function renderUnpaidTransactionsList(filteredTransactions = null) {
    let transactionsToShow = filteredTransactions || allUnpaidTransactions;
    $('#unpaid_transactions_list').empty();
    
    if (transactionsToShow.length === 0) {
        $('#unpaid_transactions_list').append('<tr><td colspan="7" class="text-center">لا توجد معاملات غير مدفوعة</td></tr>');
        return;
    }
    
    transactionsToShow.forEach((trans, index) => {
        let total = parseFloat(trans.total);
        let paid = parseFloat(trans.paid || 0);
        let remaining = total - paid;
        
        let clientName = 'عميل عابر';
        if (trans.client && trans.client._id !== '0') {
            clientName = trans.client.name;
        }
        
        let row = $(`
            <tr>
                <td><strong>${trans.order}</strong></td>
                <td>${clientName}</td>
                <td>${moment(trans.date).format('DD/MM/YYYY HH:mm')}</td>
                <td><strong>${total.toFixed(2)} ${getCurrencySymbol()}</strong></td>
                <td>${paid.toFixed(2)} ${getCurrencySymbol()}</td>
                <td class="text-danger"><strong>${remaining.toFixed(2)} ${getCurrencySymbol()}</strong></td>
                <td>
                    <button class="btn btn-sm btn-success btn-add-payment" data-transaction-id="${trans._id}">
                        <i class="fa fa-money"></i> دفع
                    </button>
                    <button class="btn btn-sm btn-info btn-view-trans" data-transaction-index="${index}">
                        <i class="fa fa-eye"></i>
                    </button>
                </td>
            </tr>
        `);
        $('#unpaid_transactions_list').append(row);
    });
    
    // Attach event handlers
    $(document).off('click', '.btn-add-payment').on('click', '.btn-add-payment', function() {
        let transactionId = $(this).data('transaction-id');
        openAddPaymentModal(transactionId);
    });
    
    $(document).off('click', '.btn-view-trans').on('click', '.btn-view-trans', function() {
        let index = $(this).data('transaction-index');
        viewUnpaidTransaction(index);
    });
}

// Search unpaid transactions
$('#searchUnpaidTransactions').on('input', function() {
    let searchTerm = $(this).val().toLowerCase();
    
    if (searchTerm === '') {
        renderUnpaidTransactionsList();
        return;
    }
    
    let filteredTransactions = allUnpaidTransactions.filter(trans => {
        let invoice = (trans.order || '').toString().toLowerCase();
        let clientName = '';
        
        if (trans.client && trans.client._id !== '0') {
            clientName = (trans.client.name || '').toLowerCase();
        } else {
            clientName = 'عميل عابر';
        }
        
        return invoice.includes(searchTerm) || clientName.includes(searchTerm);
    });
    
    renderUnpaidTransactionsList(filteredTransactions);
});

// Open add payment modal
function openAddPaymentModal(transactionId) {
    let trans = allUnpaidTransactions.find(t => t._id === transactionId);
    if (!trans) return;
    
    let total = parseFloat(trans.total);
    let paid = parseFloat(trans.paid || 0);
    let remaining = total - paid;
    
    let clientName = 'عميل عابر';
    if (trans.client && trans.client._id !== '0') {
        clientName = trans.client.name;
    }
    
    $('#transPaymentId').val(trans._id);
    $('#transPaymentInvoice').text(trans.order);
    $('#transPaymentClient').text(clientName);
    $('#transPaymentTotal').text(total.toFixed(2) + ' ' + getCurrencySymbol());
    $('#transPaymentPaid').text(paid.toFixed(2) + ' ' + getCurrencySymbol());
    $('#transPaymentRemaining').text(remaining.toFixed(2) + ' ' + getCurrencySymbol());
    $('#transPaymentAmount').val('');
    $('#transPaymentAmount').attr('max', remaining.toFixed(2));
    $('#transPaymentInfo').val('');
    
    $('#addPaymentModal').modal('show');
}

// Save transaction payment
$('#saveTransactionPayment').submit(function (e) {
    e.preventDefault();
    
    let transactionId = $('#transPaymentId').val();
    let amount = parseFloat($('#transPaymentAmount').val());
    let trans = allUnpaidTransactions.find(t => t._id === transactionId);
    
    if (!trans) return;
    
    let remaining = parseFloat(trans.total) - parseFloat(trans.paid || 0);
    
    if (amount <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'تحذير!',
            text: 'الرجاء إدخال مبلغ صحيح'
        });
        return;
    }
    
    if (amount > remaining) {
        Swal.fire({
            icon: 'warning',
            title: 'تحذير!',
            text: 'المبلغ المدخل أكبر من المتبقي',
            showCancelButton: true,
            confirmButtonText: 'متابعة على أي حال',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                submitTransactionPayment();
            }
        });
    } else {
        submitTransactionPayment();
    }
});

function submitTransactionPayment() {
    let paymentData = {
        amount: parseFloat($('#transPaymentAmount').val()),
        paymentType: parseInt($('#transPaymentType').val()),
        paymentInfo: $('#transPaymentInfo').val()
    };
    
    let transactionId = $('#transPaymentId').val();
    
    $.ajax({
        url: api + 'add-payment/' + transactionId,
        type: 'POST',
        data: JSON.stringify(paymentData),
        contentType: 'application/json',
        success: function (response) {
            Swal.fire({
                icon: 'success',
                title: 'تم!',
                text: 'تم تسجيل الدفع بنجاح',
                timer: 2000
            });
            
            $('#addPaymentModal').modal('hide');
            
            // Update client balance if applicable
            let trans = allUnpaidTransactions.find(t => t._id === transactionId);
            if (trans && trans.client && trans.client._id !== '0') {
                let clientPaymentData = {
                    amount: parseFloat($('#transPaymentAmount').val()),
                    paymentType: $('#transPaymentType option:selected').text(),
                    note: 'Payment for invoice ' + trans.order,
                    transactionId: trans.order
                };
                
                $.ajax({
                    url: api + 'clients/client/' + trans.client._id + '/payment',
                    type: 'POST',
                    data: JSON.stringify(clientPaymentData),
                    contentType: 'application/json',
                    success: function() {
                        loadClients();
                    }
                });
            }
            
            // Reload unpaid transactions
            loadUnpaidTransactions();
        },
        error: function (error) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ!',
                text: 'حدث خطأ أثناء تسجيل الدفع'
            });
        }
    });
}

// View unpaid transaction
function viewUnpaidTransaction(index) {
    if (typeof $.fn.viewTransaction === 'function') {
        transaction_index = index;
        allTransactions = allUnpaidTransactions;
        $.fn.viewTransaction(index);
    }
}

// Load unpaid transactions when button is clicked
$('#viewUnpaidTransactions').on('click', function() {
    loadUnpaidTransactions();
});

// ==================== LOW STOCK ALERTS ====================

// Check low stock
function checkLowStock() {
    let threshold = parseInt($('#stockThreshold').val()) || 10;
    
    let lowStockProducts = allProducts.filter(product => {
        // Only check products with stock tracking enabled
        if (product.stock == 0) return false;
        return product.quantity <= threshold;
    });
    
    renderLowStockList(lowStockProducts);
}

// Render low stock list
function renderLowStockList(products) {
    $('#low_stock_list').empty();
    
    if (products.length === 0) {
        $('#low_stock_list').append('<tr><td colspan="6" class="text-center text-success"><strong>جميع المنتجات بمخزون جيد! (All products have good stock)</strong></td></tr>');
        return;
    }
    
    products.forEach(product => {
        let category = allCategories.find(c => c._id == product.category);
        let categoryName = category ? category.name : '-';
        
        let statusClass = 'danger';
        let statusText = 'نفد المخزون (Out of Stock)';
        
        if (product.quantity > 0 && product.quantity <= 5) {
            statusClass = 'danger';
            statusText = 'حرج (Critical)';
        } else if (product.quantity > 5 && product.quantity <= 10) {
            statusClass = 'warning';
            statusText = 'منخفض (Low)';
        } else if (product.quantity > 10) {
            statusClass = 'info';
            statusText = 'متوسط (Medium)';
        }
        
        let row = `
            <tr class="${statusClass}">
                <td>${product.sku}</td>
                <td><strong>${product.name}</strong></td>
                <td>${categoryName}</td>
                <td><strong>${product.quantity}</strong></td>
                <td>${product.price} ${getCurrencySymbol()}</td>
                <td><span class="label label-${statusClass}">${statusText}</span></td>
            </tr>
        `;
        $('#low_stock_list').append(row);
    });
}

// Load low stock when button is clicked
$('#viewLowStock').on('click', function() {
    checkLowStock();
});

// Auto-check for critical stock on startup
setTimeout(function() {
    if (allProducts && allProducts.length > 0) {
        let criticalStock = allProducts.filter(p => p.stock == 1 && p.quantity <= 5);
        if (criticalStock.length > 0) {
            notiflix.Notify.Init({
                position: "right-bottom",
                cssAnimationDuration: 600,
                timeout: 5000,
                messageMaxLength: 200,
                cssAnimationStyle: "from-bottom"
            });
            notiflix.Notify.Warning(`تحذير: ${criticalStock.length} منتج بمخزون حرج!`);
        }
    }
}, 3000);

// ==================== CLIENT STATEMENT / LEDGER ====================

let currentStatementClient = null;

// Show client statement
function showClientStatement(clientId) {
    let client = allClients.find(c => c._id === clientId);
    if (!client) return;
    
    currentStatementClient = client;
    
    // Set client info
    $('#statementClientName').text(client.name);
    $('#statementClientPhone').text(client.phone || '-');
    $('#statementClientEmail').text(client.email || '-');
    $('#statementTotalPurchases').text((client.totalPurchases || 0).toFixed(2) + ' ' + getCurrencySymbol());
    $('#statementTotalPaid').text((client.totalPaid || 0).toFixed(2) + ' ' + getCurrencySymbol());
    $('#statementBalance').text((client.balance || 0).toFixed(2) + ' ' + getCurrencySymbol());
    
    // Load transactions for this client
    $.get(api + 'client/' + clientId + '/transactions', function(transactions) {
        renderClientStatement(client, transactions);
    }).fail(function() {
        // If API doesn't exist yet, use allTransactions
        let clientTransactions = allTransactions.filter(t => 
            t.client && t.client._id === clientId
        );
        renderClientStatement(client, clientTransactions);
    });
    
    $('#clientStatementModal').modal('show');
}

// Render client statement
function renderClientStatement(client, transactions) {
    $('#statementTransactionsList').empty();
    
    if (!transactions || transactions.length === 0) {
        $('#statementTransactionsList').append('<tr><td colspan="6" class="text-center">لا توجد معاملات (No transactions found)</td></tr>');
        return;
    }
    
    // Combine transactions and payments into a ledger
    let ledger = [];
    let runningBalance = 0;
    
    // Add all transactions (purchases)
    transactions.forEach(trans => {
        let total = parseFloat(trans.total || 0);
        let paid = parseFloat(trans.paid || 0);
        let remaining = total - paid;
        
        ledger.push({
            date: new Date(trans.date),
            type: 'فاتورة (Invoice)',
            invoice: trans.order,
            amount: total,
            paid: paid,
            balance: remaining,
            originalDate: trans.date
        });
    });
    
    // Add payment history if available
    if (client.paymentHistory && client.paymentHistory.length > 0) {
        client.paymentHistory.forEach(payment => {
            ledger.push({
                date: new Date(payment.date),
                type: 'دفعة (Payment)',
                invoice: payment.transactionId || '-',
                amount: 0,
                paid: payment.amount,
                balance: 0,
                originalDate: payment.date,
                note: payment.note
            });
        });
    }
    
    // Sort by date
    ledger.sort((a, b) => a.date - b.date);
    
    // Calculate running balance
    ledger.forEach(entry => {
        if (entry.type === 'فاتورة (Invoice)') {
            runningBalance += entry.balance;
        } else if (entry.type === 'دفعة (Payment)') {
            runningBalance -= entry.paid;
        }
        entry.runningBalance = runningBalance;
    });
    
    // Render ledger
    ledger.forEach(entry => {
        let balanceClass = entry.runningBalance > 0 ? 'text-danger' : 'text-success';
        let row = `
            <tr>
                <td>${moment(entry.date).format('DD/MM/YYYY HH:mm')}</td>
                <td><span class="label ${entry.type.includes('Invoice') ? 'label-warning' : 'label-success'}">${entry.type}</span></td>
                <td>${entry.invoice}</td>
                <td>${entry.amount > 0 ? entry.amount.toFixed(2) + ' ' + getCurrencySymbol() : '-'}</td>
                <td class="text-success">${entry.paid > 0 ? entry.paid.toFixed(2) + ' ' + getCurrencySymbol() : '-'}</td>
                <td class="${balanceClass}"><strong>${entry.runningBalance.toFixed(2)} ${getCurrencySymbol()}</strong></td>
            </tr>
        `;
        $('#statementTransactionsList').append(row);
    });
}

// Print client statement
function printClientStatement() {
    let printContent = document.getElementById('clientStatementContent').innerHTML;
    let originalContent = document.body.innerHTML;
    
    let printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Client Statement</title>');
    printWindow.document.write('<style>body{font-family:Arial;direction:rtl;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:right;} .text-danger{color:red;} .text-success{color:green;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// ==================== DATA BACKUP AND EXPORT ====================

// Export all data as JSON backup
function exportAllData() {
    Swal.fire({
        title: 'جاري تصدير البيانات...',
        text: 'يرجى الانتظار',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    Promise.all([
        $.get(api + 'products').catch(() => []),
        $.get(api + 'transactions/all').catch(() => []),
        $.get(api + 'clients/all').catch(() => []),
        $.get(api + 'category').catch(() => []),
        $.get(api + 'settings').catch(() => ({}))
    ]).then(([products, transactions, clients, categories, settings]) => {
        let backupData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: {
                products: products || [],
                transactions: transactions || [],
                clients: clients || [],
                categories: categories || [],
                settings: settings || {}
            }
        };
        
        downloadJSON(backupData, `POS-Backup-${moment().format('YYYY-MM-DD-HHmmss')}.json`);
        
        Swal.fire({
            icon: 'success',
            title: 'تم التصدير بنجاح!',
            text: 'تم حفظ نسخة احتياطية كاملة من البيانات',
            confirmButtonText: 'حسناً'
        });
    }).catch(error => {
        console.error("Backup error:", error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ في التصدير',
            text: 'حدث خطأ أثناء تصدير البيانات: ' + (error.message || 'خطأ غير معروف'),
            confirmButtonText: 'حسناً'
        });
    });
}

// Export clients only
function exportClients() {
    $.get(api + 'clients/all', function(clients) {
        downloadJSON(clients, `Clients-${moment().format('YYYY-MM-DD')}.json`);
        notiflix.Notify.Success('تم تصدير ' + clients.length + ' عميل');
    });
}

// Export transactions
function exportTransactions() {
    Swal.fire({
        title: 'تصدير المعاملات',
        html: `
            <div class="form-group">
                <label>من تاريخ:</label>
                <input type="date" id="exportFromDate" class="swal2-input">
            </div>
            <div class="form-group">
                <label>إلى تاريخ:</label>
                <input type="date" id="exportToDate" class="swal2-input">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="exportAll" checked> تصدير الكل
                </label>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'تصدير',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            let exportAll = document.getElementById('exportAll').checked;
            let fromDate = document.getElementById('exportFromDate').value;
            let toDate = document.getElementById('exportToDate').value;
            
            return { exportAll, fromDate, toDate };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            $.get(api + 'transactions/all', function(transactions) {
                let filteredTransactions = transactions;
                
                if (!result.value.exportAll) {
                    let fromDate = result.value.fromDate ? new Date(result.value.fromDate) : null;
                    let toDate = result.value.toDate ? new Date(result.value.toDate) : null;
                    
                    if (toDate) {
                        toDate.setHours(23, 59, 59); // End of day
                    }
                    
                    filteredTransactions = transactions.filter(trans => {
                        let transDate = new Date(trans.date);
                        if (fromDate && transDate < fromDate) return false;
                        if (toDate && transDate > toDate) return false;
                        return true;
                    });
                }
                
                downloadJSON(filteredTransactions, `Transactions-${moment().format('YYYY-MM-DD')}.json`);
                notiflix.Notify.Success('تم تصدير ' + filteredTransactions.length + ' معاملة');
            });
        }
    });
}

// Export products
function exportProducts() {
    $.get(api + 'products', function(products) {
        // Create CSV format for products (easier to import to Excel)
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Product Name,Barcode,Price,Quantity,Category\n";
        
        products.forEach(product => {
            csvContent += `"${product.product_name}","${product.barcode}",${product.price},${product.quantity},"${product.category}"\n`;
        });
        
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Products-${moment().format('YYYY-MM-DD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        notiflix.Notify.Success('تم تصدير ' + products.length + ' منتج');
    });
}

// Helper function to download JSON data
function downloadJSON(data, filename) {
    let dataStr = JSON.stringify(data, null, 2);
    let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    let exportFileDefaultName = filename;
    
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ==================== SALES REPORTS ====================

let currentReportData = null;

// Set default dates on modal open
$('#viewSalesReports').on('click', function() {
    let today = moment().format('YYYY-MM-DD');
    let weekAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
    
    $('#reportToDate').val(today);
    $('#reportFromDate').val(weekAgo);
});

// Event handlers for report buttons
$('#generateSalesReportBtn').on('click', function() {
    generateSalesReport();
});

$('#printSalesReportBtn').on('click', function() {
    printSalesReport();
});

$('#exportSalesReportBtn').on('click', function() {
    exportSalesReportCSV();
});

// Generate sales report
function generateSalesReport() {
    let fromDate = $('#reportFromDate').val();
    let toDate = $('#reportToDate').val();
    
    if (!fromDate || !toDate) {
        Swal.fire({
            icon: 'warning',
            title: 'تحذير',
            text: 'يرجى اختيار نطاق التاريخ',
            confirmButtonText: 'حسناً'
        });
        return;
    }
    
    // Show loading
    $('#salesReportContent').html('<div class="text-center"><i class="fa fa-spinner fa-spin fa-3x"></i><br>جاري إنشاء التقرير...</div>');
    
    $.get(api + 'transactions/all', function(transactions) {
        // Handle empty or null response
        if (!transactions || !Array.isArray(transactions)) {
            transactions = [];
        }
        
        console.log('Total transactions loaded:', transactions.length);
        
        // Filter transactions by date range
        let startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        
        let endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        
        let filteredTransactions = transactions.filter(trans => {
            let transDate = new Date(trans.date);
            return transDate >= startDate && transDate <= endDate;
        });
        
        console.log('Filtered transactions:', filteredTransactions.length);
        console.log('Date range:', fromDate, 'to', toDate);
        
        // Calculate statistics
        let stats = calculateSalesStats(filteredTransactions);
        currentReportData = { transactions: filteredTransactions, stats: stats, fromDate: fromDate, toDate: toDate };
        
        // Render report
        renderSalesReport(stats, filteredTransactions);
    }).fail(function(xhr, status, error) {
        console.error("Error loading transactions:", error);
        $('#salesReportContent').html(`
            <div class="alert alert-warning text-center">
                <i class="fa fa-exclamation-triangle"></i> 
                <strong>لا توجد بيانات</strong><br>
                لم يتم العثور على معاملات أو لم يتم إنشاء أي معاملات بعد.<br>
                قم بإنشاء بعض المعاملات أولاً ثم حاول مرة أخرى.
            </div>
        `);
    });
}

// Calculate sales statistics
function calculateSalesStats(transactions) {
    let stats = {
        totalSales: 0,
        totalTransactions: transactions.length,
        totalDiscount: 0,
        totalPaid: 0,
        totalRemaining: 0,
        cashSales: 0,
        cardSales: 0,
        creditSales: 0,
        dailyStats: {},
        productStats: {},
        clientStats: {}
    };
    
    transactions.forEach(trans => {
        let total = parseFloat(trans.total || 0);
        let paid = parseFloat(trans.paid || 0);
        let discount = parseFloat(trans.discount || 0);
        
        stats.totalSales += total;
        stats.totalDiscount += discount;
        stats.totalPaid += paid;
        stats.totalRemaining += (total - paid);
        
        // Payment method breakdown
        if (trans.status === 1) { // Fully paid
            if (trans.method === 0 || trans.method === '0' || trans.method === 'Cash') {
                stats.cashSales += total;
            } else if (trans.method === 2 || trans.method === '2' || trans.method === 'Card') {
                stats.cardSales += total;
            }
        } else {
            stats.creditSales += (total - paid);
        }
        
        // Daily stats
        let dateKey = moment(trans.date).format('YYYY-MM-DD');
        if (!stats.dailyStats[dateKey]) {
            stats.dailyStats[dateKey] = { sales: 0, transactions: 0 };
        }
        stats.dailyStats[dateKey].sales += total;
        stats.dailyStats[dateKey].transactions++;
        
        // Product stats
        if (trans.cart && Array.isArray(trans.cart)) {
            trans.cart.forEach(item => {
                if (!stats.productStats[item.product_name]) {
                    stats.productStats[item.product_name] = { quantity: 0, revenue: 0 };
                }
                stats.productStats[item.product_name].quantity += item.quantity;
                stats.productStats[item.product_name].revenue += (item.quantity * item.price);
            });
        }
        
        // Client stats
        if (trans.client && trans.client._id !== '0') {
            let clientName = trans.client.name;
            if (!stats.clientStats[clientName]) {
                stats.clientStats[clientName] = { purchases: 0, amount: 0 };
            }
            stats.clientStats[clientName].purchases++;
            stats.clientStats[clientName].amount += total;
        }
    });
    
    return stats;
}

// Render sales report
function renderSalesReport(stats, transactions) {
    let html = `
        <div class="row">
            <div class="col-md-3">
                <div class="panel panel-primary">
                    <div class="panel-body text-center">
                        <h4>إجمالي المبيعات</h4>
                        <h2>${stats.totalSales.toFixed(2)} ${getCurrencySymbol()}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="panel panel-success">
                    <div class="panel-body text-center">
                        <h4>المدفوع</h4>
                        <h2>${stats.totalPaid.toFixed(2)} ${getCurrencySymbol()}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="panel panel-danger">
                    <div class="panel-body text-center">
                        <h4>المتبقي</h4>
                        <h2>${stats.totalRemaining.toFixed(2)} ${getCurrencySymbol()}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="panel panel-info">
                    <div class="panel-body text-center">
                        <h4>عدد المعاملات</h4>
                        <h2>${stats.totalTransactions}</h2>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-4">
                <div class="panel panel-default">
                    <div class="panel-heading">طرق الدفع</div>
                    <div class="panel-body">
                        <p><strong>نقدي:</strong> ${stats.cashSales.toFixed(2)} ${getCurrencySymbol()}</p>
                        <p><strong>بطاقة:</strong> ${stats.cardSales.toFixed(2)} ${getCurrencySymbol()}</p>
                        <p><strong>آجل:</strong> ${stats.creditSales.toFixed(2)} ${getCurrencySymbol()}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="panel panel-default">
                    <div class="panel-heading">الخصومات</div>
                    <div class="panel-body">
                        <h3>${stats.totalDiscount.toFixed(2)} ${getCurrencySymbol()}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="panel panel-default">
                    <div class="panel-heading">متوسط المبيعات</div>
                    <div class="panel-body">
                        <h3>${(stats.totalSales / (stats.totalTransactions || 1)).toFixed(2)} ${getCurrencySymbol()}</h3>
                    </div>
                </div>
            </div>
        </div>
        
        <h4>أفضل المنتجات مبيعاً</h4>
        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>الإيرادات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Top products
    let topProducts = Object.entries(stats.productStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);
    
    if (topProducts.length === 0) {
        html += '<tr><td colspan="3" class="text-center">لا توجد بيانات</td></tr>';
    } else {
        topProducts.forEach(([product, data]) => {
            html += `
                <tr>
                    <td>${product}</td>
                    <td>${data.quantity}</td>
                    <td>${data.revenue.toFixed(2)} ${getCurrencySymbol()}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    
    // Top clients
    if (Object.keys(stats.clientStats).length > 0) {
        html += `
            <h4>أفضل العملاء</h4>
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>العميل</th>
                        <th>عدد المشتريات</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let topClients = Object.entries(stats.clientStats)
            .sort((a, b) => b[1].amount - a[1].amount)
            .slice(0, 10);
        
        topClients.forEach(([client, data]) => {
            html += `
                <tr>
                    <td>${client}</td>
                    <td>${data.purchases}</td>
                    <td>${data.amount.toFixed(2)} ${getCurrencySymbol()}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
    }
    
    $('#salesReportContent').html(html);
}

// Print sales report
function printSalesReport() {
    if (!currentReportData) {
        Swal.fire({
            icon: 'warning',
            title: 'تحذير',
            text: 'يرجى إنشاء التقرير أولاً',
            confirmButtonText: 'حسناً'
        });
        return;
    }
    
    let printContent = document.getElementById('salesReportContent').innerHTML;
    let printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Sales Report</title>');
    printWindow.document.write('<style>body{font-family:Arial;direction:rtl;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:right;} .panel{border:1px solid #ddd;margin:10px;padding:10px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h2>تقرير المبيعات</h2><p>من ${currentReportData.fromDate} إلى ${currentReportData.toDate}</p>`);
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// Export sales report as CSV
function exportSalesReportCSV() {
    if (!currentReportData) {
        Swal.fire({
            icon: 'warning',
            title: 'تحذير',
            text: 'يرجى إنشاء التقرير أولاً',
            confirmButtonText: 'حسناً'
        });
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Sales Report (${currentReportData.fromDate} to ${currentReportData.toDate})\n\n`;
    csvContent += "Invoice,Date,Client,Total,Paid,Remaining,Status\n";
    
    currentReportData.transactions.forEach(trans => {
        let clientName = trans.client && trans.client._id !== '0' ? trans.client.name : 'Walk-in';
        let total = parseFloat(trans.total || 0);
        let paid = parseFloat(trans.paid || 0);
        let remaining = total - paid;
        let status = trans.status === 1 ? 'Paid' : 'Unpaid';
        
        csvContent += `${trans.order},${moment(trans.date).format('YYYY-MM-DD HH:mm')},"${clientName}",${total.toFixed(2)},${paid.toFixed(2)},${remaining.toFixed(2)},${status}\n`;
    });
    
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales-Report-${moment().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    notiflix.Notify.Success('تم تصدير التقرير');
}


