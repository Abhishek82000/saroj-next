<?php 
namespace App\Http\Controllers\badmin;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PaymentsController extends Controller
{
    public function index(){
        $title='Payments Options';
        return view('badmin.payments.index',compact('title'));
    }
}