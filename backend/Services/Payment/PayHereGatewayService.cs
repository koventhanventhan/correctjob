using HireConnect.API.DTOs.Payment;
using System.Security.Cryptography;
using System.Text;

namespace HireConnect.API.Services.Payment
{
    public class PayHereGatewayService : IPaymentGatewayService
    {
        private readonly IConfiguration _config;

        public PayHereGatewayService(IConfiguration config)
        {
            _config = config;
        }

        public CreateOrderResponseDto GenerateOrder(Models.Payment payment)
        {
            var merchantId = _config["PayHere:MerchantId"] ?? throw new InvalidOperationException("MerchantId not configured");
            var merchantSecret = _config["PayHere:MerchantSecret"] ?? throw new InvalidOperationException("MerchantSecret not configured");

            string amountFormatted = payment.Amount.ToString("0.00");
            string hash = GenerateHash(merchantId, payment.OrderId, amountFormatted, payment.Currency, merchantSecret);

            return new CreateOrderResponseDto
            {
                MerchantId = merchantId,
                OrderId = payment.OrderId,
                Amount = amountFormatted,
                Currency = payment.Currency,
                Hash = hash
            };
        }

        public bool VerifyNotification(PayHereNotifyRequestDto notifyDto)
        {
            var merchantId = _config["PayHere:MerchantId"] ?? throw new InvalidOperationException("MerchantId not configured");
            var merchantSecret = _config["PayHere:MerchantSecret"] ?? throw new InvalidOperationException("MerchantSecret not configured");

            // verify md5sig
            string amountFormatted = notifyDto.payhere_amount;
            string expectedHash = GenerateHash(merchantId, notifyDto.order_id, amountFormatted, notifyDto.payhere_currency, merchantSecret, notifyDto.status_code);

            return string.Equals(expectedHash, notifyDto.md5sig, StringComparison.OrdinalIgnoreCase);
        }

        private string GenerateHash(string merchantId, string orderId, string amount, string currency, string merchantSecret, string statusCode = "")
        {
            // hash = MD5(merchant_id + order_id + amount(formatted to 2 decimals) + currency + status_code(if notification) + UPPERCASE(MD5(merchant_secret))).ToUpper()
            
            string secretHash = GetMd5(merchantSecret).ToUpper();
            
            string rawStr = merchantId + orderId + amount + currency + statusCode + secretHash;
            
            return GetMd5(rawStr).ToUpper();
        }

        private string GetMd5(string input)
        {
            using (MD5 md5 = MD5.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(input);
                byte[] hashBytes = md5.ComputeHash(inputBytes);

                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    sb.Append(hashBytes[i].ToString("X2"));
                }
                return sb.ToString();
            }
        }
    }
}
