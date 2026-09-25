using HireConnect.API.DTOs.Payment;

namespace HireConnect.API.Services.Payment
{
    public interface IPaymentGatewayService
    {
        CreateOrderResponseDto GenerateOrder(Models.Payment payment);
        bool VerifyNotification(PayHereNotifyRequestDto notifyDto);
    }
}
