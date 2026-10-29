<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Session;
use Illuminate\Support\Facades\Route;
class AdminSession
{
    public function handle(Request $request, Closure $next)
    {
	    if (!$request->session()->exists('B_ADMIN'))
        {
            return redirect()->route('adminLogin');// here you should redirect to login 
        }
        return $next($request);
    }
}