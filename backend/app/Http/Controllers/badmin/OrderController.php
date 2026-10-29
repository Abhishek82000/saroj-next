<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ArTransactions;
use App\Models\ArUsers;
use App\Models\ArProduct;
use App\Models\ArTransactionDetails;
use App\Models\ArThemeAdmin;
use App\Models\ArShippingAgency;
use App\Models\ArUniqueIds;
use App\Models\ArSeller;
use App\Mail\sendingEmail;
use App\Traits\ShiprocketTrait;
use DB;
use Session;
use Illuminate\Support\Str;
use App\Services\DelhiveryService;

class OrderController extends Controller
{
    use ShiprocketTrait;
    public function orders(Request $request, $status = 'pending')
    {
        $query = ArTransactions::where('trans_payment_status', 1)->where('trans_is_wholesale', 0)
            ->orderByDesc('trans_id');

        // ✅ Save filters to session if POST
        if ($request->isMethod('post')) {			 
            Session::put('ORDER_FILTER', $request->all());
            Session::save();			
        }

        $aryFilterSession = Session::get('ORDER_FILTER', []);

        // ✅ Apply filters safely
        $query->when(!empty($aryFilterSession['search_filter']), function ($q) use ($aryFilterSession) {
            $q->where(function ($sub) use ($aryFilterSession) {
                $search = $aryFilterSession['search_filter'];
                $sub->where('trans_user_name', 'LIKE', "%{$search}%")
                    ->orWhere('trans_order_number', 'LIKE', "%{$search}%");
            });
        });

        $query->when(!empty($aryFilterSession['from']) && !empty($aryFilterSession['to']), function ($q) use ($aryFilterSession) {
            $from = $aryFilterSession['from'] . ' 00:00:00';
            $to   = $aryFilterSession['to'] . ' 23:59:59';
            $q->whereBetween('trans_datetime', [$from, $to]);
        });

        // ✅ Order Status Mapping
        $orderStatus = [
            1 => 'Ready to Ship',
            4 => 'Delivered',
            5 => 'Cancelled',
            6 => 'Shipped',
        ];

        // ✅ Status Counts (safer SQL syntax)
        $statusCounts = ArTransactions::where('trans_payment_status', 1)->where('trans_is_wholesale', 0)
            ->selectRaw('
                COUNT(CASE WHEN trans_status = 1 AND trans_accept_status = 2 THEN 1 END) as confirm_count,
                COUNT(CASE WHEN trans_status = 4 THEN 1 END) as delivered,
                COUNT(CASE WHEN trans_status = 5 THEN 1 END) as cancelled,
                COUNT(CASE WHEN trans_status = 6 THEN 1 END) as shipped,
                COUNT(*) as total_order
            ')
            ->first();

        // ✅ Paginate final data
        $resOrderData = $query->paginate(50);

        $title = 'Orders';

        return view('badmin.orders.order', compact(
            'title',
            'resOrderData',
            'statusCounts',
            'aryFilterSession',
            'orderStatus',
            'status'
        ));
    }
    public function wholesaleOrders(Request $request, $status = 'pending')
    {
        $query = ArTransactions::where('trans_payment_status', 1)->where('trans_is_wholesale', 1)
            ->orderByDesc('trans_id');

        // ✅ Save filters to session if POST
        if ($request->isMethod('post')) {			 
            Session::put('ORDER_FILTER', $request->all());
            Session::save();			
        }

        $aryFilterSession = Session::get('ORDER_FILTER', []);

        // ✅ Apply filters safely
        $query->when(!empty($aryFilterSession['search_filter']), function ($q) use ($aryFilterSession) {
            $q->where(function ($sub) use ($aryFilterSession) {
                $search = $aryFilterSession['search_filter'];
                $sub->where('trans_user_name', 'LIKE', "%{$search}%")
                    ->orWhere('trans_order_number', 'LIKE', "%{$search}%");
            });
        });

        $query->when(!empty($aryFilterSession['from']) && !empty($aryFilterSession['to']), function ($q) use ($aryFilterSession) {
            $from = $aryFilterSession['from'] . ' 00:00:00';
            $to   = $aryFilterSession['to'] . ' 23:59:59';
            $q->whereBetween('trans_datetime', [$from, $to]);
        });

        // ✅ Order Status Mapping
        $orderStatus = [
            1 => 'Ready to Ship',
            4 => 'Delivered',
            5 => 'Cancelled',
            6 => 'Shipped',
        ];

        // ✅ Status Counts (safer SQL syntax)
        $statusCounts = ArTransactions::where('trans_payment_status', 1)->where('trans_is_wholesale', 1)
            ->selectRaw('
                COUNT(CASE WHEN trans_status = 1 AND trans_accept_status = 2 THEN 1 END) as confirm_count,
                COUNT(CASE WHEN trans_status = 4 THEN 1 END) as delivered,
                COUNT(CASE WHEN trans_status = 5 THEN 1 END) as cancelled,
                COUNT(CASE WHEN trans_status = 6 THEN 1 END) as shipped,
                COUNT(*) as total_order
            ')
            ->first();

        // ✅ Paginate final data
        $resOrderData = $query->paginate(50);

        $title = 'Wholesale Orders';

        return view('badmin.orders.wholesale_order', compact(
            'title',
            'resOrderData',
            'statusCounts',
            'aryFilterSession',
            'orderStatus',
            'status'
        ));
    }

    public function droppedOrders(Request $request, $status = 'pending')
    {
        // return $request->all();
        $query = ArTransactions::orderBy('trans_id', 'DESC')
            ->where('trans_payment_status', 0);

        // Store filters in session on POST
        if ($request->isMethod('post')) {
            Session::put('DORDER_FILTER', $request->all());
            Session::save();
        }

        $filters = Session::get('DORDER_FILTER', []);

        // Apply filters
        if (!empty($filters)) {

            // 🔍 Search by username or order number
            if (!empty($filters['search_filter']) && is_string($filters['search_filter'])) {
                $search = trim($filters['search_filter']);
                $query->where(function ($q) use ($search) {
                    $q->where('trans_user_name', 'LIKE', "%{$search}%")
                    ->orWhere('trans_order_number', 'LIKE', "%{$search}%");
                });
            }

            // 📅 Filter by date range
            if (!empty($filters['from']) && !empty($filters['to'])) {
                $from = $filters['from'] . ' 00:00:00';
                $to   = $filters['to'] . ' 23:59:59';
                $query->whereBetween('trans_datetime', [$from, $to]);
            }
        }

        // Order status mapping
        $orderStatus = [
            1 => 'Ready to Ship',
            4 => 'Delivered',
            5 => 'Cancelled',
            6 => 'Shipped',
        ];

        $title = 'Dropped Orders';
        $resOrderData = $query->paginate(50);

        return view('badmin.orders.drop_order', compact('title', 'resOrderData', 'filters', 'orderStatus', 'status'));
    }

    public function droppedOrderfilter(Request $request){
        Session::forget('DORDER_FILTER');
        return redirect()->back();
    }
    public function orderfilter(Request $request){
        Session::forget('ORDER_FILTER');
        return redirect()->back();
    }
	
	public function ordersview($id=null){
        $title='Orders View';
        $orderStatus = [
            1 => 'Ready to Ship',
            4 => 'Delivered',
            5 => 'Cancelled',
            6 => 'Shipped',
        ];
        $rowOrderData = ArTransactions::where('trans_order_number',$id)->with(['items'])->first();
        return view('badmin.orders.view_order',compact('title','rowOrderData','orderStatus'));
    }

    public function changestatus(Request $request){ 
        if($request->status==6){
            $rowTransData = ArTransactions::where('trans_id',$request->trans_id)->with(['items'])->first();
            if(empty($rowTransData->trans_tracking_id)){
                return response()->json(['status'=>'error','message' =>'Please add tracking id and tracking Url first.']);
            }
            try {
                $details = [
                    'subject' => 'Just Shipped!',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.order_shipped', 
                ];
                \Mail::to($details['rowTransData']['trans_user_email'])->send(new sendingEmail($details));
                $details1 = [
                    'subject' => 'Order Shipped!',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.order_shipped', 
                ];
                $rowAdminData = ArThemeAdmin::first(); 
                \Mail::to($rowAdminData->admin_email)->send(new sendingEmail($details1));
              } catch (\Exception $e) {              
                //   return $e->getMessage();
              }
            ArTransactions::where('trans_id',$request->trans_id)->update(['trans_status'=>$request->status,'trans_shipped_datetime'=>date('Y-m-d H:i:s')]);
            
        }elseif($request->status==4){
            $rowTransData = ArTransactions::where('trans_id',$request->trans_id)->with(['items'])->first();
            try {
                $details = [
                    'subject' => 'Happiness has arrived at your doorstep!',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.delivered', 
                ];
                \Mail::to($details['rowTransData']['trans_user_email'])->send(new sendingEmail($details));
                $details1 = [
                    'subject' => 'Order Delivered',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.delivered', 
                ];
                $rowAdminData = ArThemeAdmin::first(); 
                \Mail::to($rowAdminData->admin_email)->send(new sendingEmail($details1));
              } catch (\Exception $e) {
              //   return $e->getMessage();
              }
            ArTransactions::where('trans_id',$request->trans_id)->update(['trans_status'=>$request->status,'trans_delivered_datetime'=>date('Y-m-d H:i:s')]);
        }elseif($request->status==5){
            $rowTransData = ArTransactions::where('trans_id',$request->trans_id)->with(['items'])->first();
            try {
                $details = [
                    'subject' => 'Order Cancelled!',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.order_cancelled', 
                ];
                \Mail::to($details['rowTransData']['trans_user_email'])->send(new sendingEmail($details));
                $details1 = [
                    'subject' => 'Order Cancelled',
                    'rowTransData' => $rowTransData,
                    'template' =>'frontend.emails.order_cancelled', 
                ];
                $rowAdminData = ArThemeAdmin::first(); 
                \Mail::to($rowAdminData->admin_email)->send(new sendingEmail($details1));
              } catch (\Exception $e) {              
                //   return $e->getMessage();
              }
              ArTransactions::where('trans_id',$request->trans_id)->update(['trans_status'=>$request->status,'trans_cancellation_date'=>date('Y-m-d H:i:s')]);
        }        
        return response()->json(['status'=>'success','message' =>'Item Status Updated Successfully']);
    }

    public function acceptOrder($trans_id){
        $rowAdminData = ArThemeAdmin::first();
        if(isset($rowAdminData) && $rowAdminData->admin_agency_active>0){
            $prderStatus = $this->createOrder($trans_id); 
            //return $prderStatus;
            if($prderStatus['status_code']==1){
                $rowTransData = ArTransactions::where('trans_id',$trans_id)->with(['items'])->first();
                try {
                    $details = [
                        'subject' => 'Saroj Textiles has Confirmed your order.',
                        'rowTransData' => $rowTransData,
                        'template' =>'frontend.emails.order_confirmation', 
                    ];
                    \Mail::to($details['rowTransData']['trans_user_email'])->send(new sendingEmail($details));
                    $details1 = [
                        'subject' => 'New order confirmed.',
                        'rowTransData' => $rowTransData,
                        'template' =>'frontend.emails.order_confirmation', 
                    ];
                    \Mail::to($rowAdminData->admin_email)->send(new sendingEmail($details1));
                    return redirect()->back()->with('success', 'Shipping updated successfully!');
                  
                  } catch (\Exception $e) {                  
                    //   return $e->getMessage();
                  }
                                  
            }else{
                if($prderStatus['status_code']==5){
                    return redirect()->back()->with('success', 'Order Cancelled already');
                }else{
                    return redirect()->back()->with('success', $prderStatus['message']);
                }
                
            }
        }else{
            $rowTransData = ArTransactions::where('trans_id',$trans_id)->with(['items'])->first();
                try {
                    $details = [
                        'subject' => 'Saroj Textiles has Confirmed your order.',
                        'rowTransData' => $rowTransData,
                        'template' =>'frontend.emails.order_confirmation', 
                    ];
                    \Mail::to($details['rowTransData']['trans_user_email'])->send(new sendingEmail($details));
                    $details1 = [
                        'subject' => 'New order confirmed.',
                        'rowTransData' => $rowTransData,
                        'template' =>'frontend.emails.order_confirmation', 
                    ];
                    \Mail::to($rowAdminData->admin_email)->send(new sendingEmail($details1));
                  
                } catch (\Exception $e) {                  
                //   return $e->getMessage();
                }
            if($rowTransData->trans_payment_status ==0){
                ArTransactions::where('trans_id',$trans_id)->update(['trans_accept_status'=>2,'trans_confirmed_datetime'=>date('Y-m-d H:i:s'),'trans_payment_status'=>1,'trans_status'=>1]);
                foreach($rowTransData->items as $d) {
                    if ($d->product->product_type == 0) {
                        $qty = $d->product->product_stock - $d->td_item_qty;
                        ArProduct::where('product_id',$d->td_item_id)->update(['product_stock'=>abs($qty)]);
                    } else {
                        $variation = ArProductVariation::find($d->td_item_id);
                        $qty = $variation->pv_quantity - $d->td_item_qty;
                        ArProductVariation::where('pv_id',$variation->pv_id)->update(['pv_quantity'=>abs($qty)]);
                    }
                }
            }else{
                ArTransactions::where('trans_id',$trans_id)->update(['trans_accept_status'=>2,'trans_confirmed_datetime'=>date('Y-m-d H:i:s')]);
            }
            return redirect()->back()->with('success', 'Shipping updated successfully!');
        }

    }

    public function createOrder($trans_id){
        $dimentions = $this->calculateOrderDimentions($trans_id);
        $rowTransData = ArTransactions::where('trans_id',$trans_id)->with(['items'])->first();
        $rowAdminData = ArThemeAdmin::first();
        $rowAgencyCredentials = ArShippingAgency::where('agency_type',$rowAdminData->admin_agency_active)->first();
        if(isset($rowTransData) && $rowTransData->trans_id){
            if(isset($rowTransData->trans_method) && $rowTransData->trans_method=='cod'){
                $payment_method = 'COD';
            }else{
                $payment_method = 'Prepaid';
            }
            if($rowTransData->trans_shippment_data!='null'){
                $shippingArray = json_decode($rowTransData->trans_shippment_data,true);
                $companyName = $shippingArray['courier_name'];
            }else{
                $companyName = '';
            }
            $order_items = $this->orderItems($trans_id);
            $order_sub_total = $this->orderSubTotal($trans_id);
            $postData['order_id'] = $rowTransData->trans_order_number;
            $postData['order_date'] = date('Y-m-d',strtotime($rowTransData->trans_datetime));
            $postData['pickup_location'] = "Primary";
            $postData['channel_id'] = "";
            $postData['comment'] = "";
            $postData['reseller_name'] = "";
            $postData['company_name'] = $companyName;
            $postData['billing_customer_name'] = $rowTransData->trans_user_name;
            $postData['billing_last_name'] = "";
            $postData['billing_address'] = $rowTransData->trans_billing_address;
            $postData['billing_address_2'] = "";
            $postData['billing_isd_code'] = "";
            $postData['billing_city'] = $rowTransData->trans_city;
            $postData['billing_pincode'] = $rowTransData->trans_pincode;
            $postData['billing_state'] = $rowTransData->trans_state;
            $postData['billing_country'] = $rowTransData->trans_country;
            $postData['billing_email'] = $rowTransData->trans_user_email;
            $postData['billing_phone'] = $rowTransData->trans_user_mobile; 
            $postData['billing_alternate_phone'] = "";
            $postData['shipping_is_billing'] = "1";
            $postData['shipping_customer_name'] = "";
            $postData['shipping_last_name'] = "";
            $postData['shipping_address'] = "";
            $postData['shipping_address_2'] = "";
            $postData['shipping_city'] = "";
            $postData['shipping_pincode'] = "";
            $postData['shipping_country'] = "";
            $postData['shipping_state'] = "";
            $postData['shipping_email'] = "";
            $postData['shipping_phone'] = "";
            $postData['order_items'] = $order_items;
            $postData['payment_method'] = $payment_method;
            $postData['shipping_charges'] = (isset($rowTransData->trans_shipping_amount) && $rowTransData->trans_shipping_amount!='')?$rowTransData->trans_shipping_amount:0;
            $postData['giftwrap_charges'] = "";
            $postData['transaction_charges'] = "";
            $postData['total_discount'] = (isset($rowTransData->trans_coupon_dis_amt) && $rowTransData->trans_coupon_dis_amt!='')?$rowTransData->trans_coupon_dis_amt:0;
            $postData['sub_total'] = $order_sub_total;
            $postData['length'] = $dimentions['length'];
            $postData['breadth'] = $dimentions['width'];
            $postData['height'] = $dimentions['height'];
            $postData['weight'] = $dimentions['weight'];
            $postData['ewaybill_no'] = "";
            $postData['customer_gstin'] = "";
            $postData['invoice_number'] = "";
            $postData['order_type'] = "";
            $data = json_encode($postData);
            $customeOrderData = $this->createCustomOrder($rowAdminData->admin_agency_active,$data); 
            if($customeOrderData['status_code']==1){
                ArTransactions::where('trans_id',$trans_id)->update(['trans_shiprocket_order_response'=>json_encode($customeOrderData,true),'trans_accept_status'=>1]);
                return $customeOrderData;
            }else{
                return $customeOrderData;
            }
        }
    }
    public function orderSubTotal($trans_id){
         $rowTransDetailsData = ArTransactionDetails::where('td_trans_id',$trans_id)->get();
        $subtotal = 0;
        foreach ($rowTransDetailsData as $key=>$value) {
            $subtotal += $value->td_item_sellling_price * $value->td_item_qty;
        }

        return $subtotal;
    }
    public function orderInvoice($orderId=null){        
        $title='Invoice View';
        $transDetails = ArTransactions::where('trans_id',$orderId)->with('items.product')->first();
        $invoiceDate = $transDetails->trans_datetime;
        return view('badmin.orders.order_invoice',compact('title','transDetails','invoiceDate'));
    }

    public function orderItems($trans_id){
        $rowTransDetailsData = ArTransactionDetails::where('td_trans_id',$trans_id)->get();
        $array = [];
        foreach ($rowTransDetailsData as $key=>$value) {
            $response['name'] = $value->td_item_title;
            $response['sku'] = $value->td_item_sku;
            $response['units'] = $value->td_item_qty;
            $response['selling_price'] = $value->td_item_sellling_price;
            $response['discount'] =0;
            $response['tax'] = $value->td_gst;
            $response['hsn'] = $value->td_item_hsn;
            array_push($array,$response);
        }
        return $array;
    } 

    public function calculateOrderDimentions($trans_id){
        $rowTransDetailsData = ArTransactionDetails::where('td_trans_id',$trans_id)->get();
        $weight = 0; $height = 0; $width = 0; $length = 0;
        foreach ($rowTransDetailsData as $key=>$value) {
            $weight += $value->td_item_weight; 
            $height += $value->td_item_height; 
            $width = $value->td_item_width; 
            $length = $value->td_item_length;
        }
        $response['weight'] = (float)$weight;
        $response['height'] = (float)$height;
        $response['width'] = (float)$width;
        $response['length'] = (float)$length;
        return $response;
    } 

    

    public function addtracking(Request $request)
    {
        $isdataexists = ArTransactions::where('trans_id',$request->transid)
            ->update(['trans_tracking_id'=>$request->trans_tracking_id,'trans_tracking_url'=>$request->trans_tracking_url
        ]);
        if($isdataexists) {
            return response()->json(['status' => 'ok', 'notification' => 'Tracking details updated successfully!!'],200);
        }else{
            return response()->json(['status' => 'failed', 'notification' => 'Internal error, please try again!!'],200);
        }
    }
    public function getUniqueId($id)
    { 
        $rowUniqueId = ArUniqueIds::where('ui_id',$id)->first();
        $intCurrentCounter = $rowUniqueId->ui_current+1;
        $strCategoryId = $rowUniqueId->ui_prefix.$intCurrentCounter;
        ArUniqueIds::where('ui_id',$id)->update(['ui_current'=>$intCurrentCounter]);
        return $strCategoryId;
    }
    public function assignToDelhivery(Request $request)
    {
        $order_id = $request->input('trans_id');
        $weight = max((float)$request->input('trans_weight'), 0.5);
        $height = max((float)$request->input('trans_height'), 10);
        $width  = max((float)$request->input('trans_width'), 10);
        $length = max((float)$request->input('trans_length'), 10);
        $order = ArTransactions::where('trans_id',$order_id)->first();
        if(!$order){
            return response()->json(['status' => 'error', 'message' => 'Order not found'],200);
        }

        $delhivery = new DelhiveryService();

        // ✅ Check Serviceability
        $service = $delhivery->checkServiceability($order->trans_pincode);

        if (!$service['status']) {
            return response()->json(['status' => 'error', 'message' => 'Pincode not serviceable'],200);
        }

        // ✅ Create Order
        $response = $delhivery->createOrder($order_id, $weight, $height, $width, $length);
        if (!empty($response['packages'][0]['waybill'])) {            
            $trans_waybill = $response['packages'][0]['waybill'];
            $trans_shipment_status = $response['packages'][0]['status'] ?? 'created';
        } else {
            $trans_waybill = '';
            $trans_shipment_status = '';
        }
        if (isset($response['success']) && $response['success'] == true) {
            ArTransactions::where('trans_id',$order_id)->update([
                'delivery_type' => 'Delhivery',
                'trans_weight' => $weight,
                'trans_length' => $length,
                'trans_width' => $width,
                'trans_height' => $height,
                'trans_waybill' => $trans_waybill,
                'trans_shipment_status' => $trans_shipment_status,
                'trans_shiprocket_order_response' => json_encode($response)
            ]);
            return response()->json(['status' => 'success', 'message' => 'Shipment created successfully','redirect_url' => route('badmin.location.acceptOrder',$order_id)],200);
        }
        return response()->json(['status' => 'error', 'message' => 'Shipment creation failed'],200);
    }
}