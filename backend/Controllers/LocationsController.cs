using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireConnect.API.Data;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLocations()
        {
            var locations = await _context.Locations
                .Where(l => l.IsActive)
                .OrderBy(l => l.Name)
                .Select(l => new
                {
                    l.Id,
                    l.Name,
                    l.StateOrProvince,
                    l.Country
                })
                .ToListAsync();

            return Ok(locations);
        }
    }
}
