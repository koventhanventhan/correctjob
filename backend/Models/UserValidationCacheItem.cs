namespace HireConnect.API.Models
{
    public class UserValidationCacheItem
    {
        public bool IsActive { get; set; }
        public string Role { get; set; } = string.Empty;
        public string SecurityStamp { get; set; } = string.Empty;
        public bool MustChangePassword { get; set; }

        public UserValidationCacheItem() { }

        public UserValidationCacheItem(bool isActive, string role, string securityStamp, bool mustChangePassword)
        {
            IsActive = isActive;
            Role = role;
            SecurityStamp = securityStamp;
            MustChangePassword = mustChangePassword;
        }
    }
}
