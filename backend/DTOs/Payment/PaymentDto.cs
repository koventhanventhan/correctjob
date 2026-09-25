using System.Security.Cryptography;
using System.Text;

namespace HireConnect.API.DTOs.Payment
{
    public class CreateOrderRequestDto
    {
        public int JobId { get; set; }
    }

    public class CreateOrderResponseDto
    {
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string Amount { get; set; } = string.Empty;
        public string Currency { get; set; } = "LKR";
        public string Hash { get; set; } = string.Empty;
    }

    public class PayHereNotifyRequestDto
    {
        public string merchant_id { get; set; } = string.Empty;
        public string order_id { get; set; } = string.Empty;
        public string payment_id { get; set; } = string.Empty;
        public string payhere_amount { get; set; } = string.Empty;
        public string payhere_currency { get; set; } = string.Empty;
        public string status_code { get; set; } = string.Empty;
        public string md5sig { get; set; } = string.Empty;
        public string custom_1 { get; set; } = string.Empty;
        public string custom_2 { get; set; } = string.Empty;
    }
}
