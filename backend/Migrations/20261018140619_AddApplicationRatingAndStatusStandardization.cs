using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireConnect.API.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationRatingAndStatusStandardization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "Applications",
                type: "int",
                nullable: true);

            // Data mapping for legacy application status values
            migrationBuilder.Sql("UPDATE Applications SET Status = 'Viewed' WHERE Status = 'Under Review' OR Status = 'UnderReview';");
            migrationBuilder.Sql("UPDATE Applications SET Status = 'Interview' WHERE Status = 'Interview Scheduled' OR Status = 'InterviewScheduled';");
            migrationBuilder.Sql("UPDATE Applications SET Status = 'Hired' WHERE Status = 'Selected';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Applications");
        }
    }
}
