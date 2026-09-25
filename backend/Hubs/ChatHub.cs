using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireConnect.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        public async Task JoinApplicationGroup(int applicationId)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                Context.Abort();
                return;
            }

            // Verify ownership
            var application = await _context.Applications
                .Include(a => a.Seeker)
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null)
            {
                Context.Abort();
                return;
            }

            bool isSeeker = application.Seeker.UserId == userId;
            bool isEmployer = application.Job.Company.EmployerId == userId;

            if (!isSeeker && !isEmployer)
            {
                Context.Abort(); // Unauthorized access to this chat group
                return;
            }

            var groupName = $"Application_{applicationId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            
            // Optional: Notify others that user joined
            // await Clients.Group(groupName).SendAsync("UserJoined", userId);
        }

        public async Task LeaveApplicationGroup(int applicationId)
        {
            var groupName = $"Application_{applicationId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task SendMessage(int applicationId, string content)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return;

            // Verify ownership
            var application = await _context.Applications
                .Include(a => a.Seeker)
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null) return;

            bool isSeeker = application.Seeker.UserId == userId;
            bool isEmployer = application.Job.Company.EmployerId == userId;

            if (!isSeeker && !isEmployer) return;

            // Save message to DB
            var message = new Message
            {
                ApplicationId = applicationId,
                SenderId = userId,
                Content = content,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Fetch sender info for frontend
            var sender = await _context.Users.FindAsync(userId);
            var senderName = sender?.FullName ?? "Unknown";

            var groupName = $"Application_{applicationId}";
            
            // Broadcast message to group
            await Clients.Group(groupName).SendAsync("ReceiveMessage", new
            {
                Id = message.Id,
                ApplicationId = message.ApplicationId,
                SenderId = message.SenderId,
                SenderName = senderName,
                Content = message.Content,
                SentAt = message.SentAt,
                IsRead = message.IsRead
            });
        }
    }
}
