<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use DB;
use App\Models\ArTicket;



class TicketController extends Controller
{
    public function ticket(){
        $title='Seller Ticket';
        $ticketData = ArTicket::orderby('ticket_id','DESC')->paginate(50);
        $issueType = array('1' => 'Order Processing Related', 'Listing & Catalog', 'Payments', 'Account related', 'Inventory Management', 'Seller performance', 'Returns & SPF', 'Promotions', 'Advertising', 'ΑΡΙ', 'Business/Value added Services');
        return view('badmin.ticket.allticket',compact('title','ticketData','issueType'));
    }
	
	
	
	public function ticketbulkaction(Request $request){
        if($request->getstatus == 1){
            foreach(array_filter(array_unique($request->ticketid)) as $key => $value) {
               $update =ArTicket::where('ticket_id',$value)->update(['ticket_status'=>0]);
            }
            
        }

        if($request->getstatus == 2){
             foreach (array_filter(array_unique($request->ticketid)) as $key => $value) {
                $update =ArTicket::where('ticket_id',$value)->update(['ticket_status'=>1]);
            }
           
        }

        

        if($update){
            return response()->json(['status' => true, 'message' => 'Status Updated successfully!!'],200);
        }else{
            return response()->json(['status' => false, 'message' => 'something went wrong!!'],201);
        }
    }

  
}