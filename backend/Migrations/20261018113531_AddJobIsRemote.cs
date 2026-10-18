using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireConnect.API.Migrations
{
    /// <inheritdoc />
    public partial class AddJobIsRemote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRemote",
                table: "Jobs",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRemote",
                table: "Jobs");
        }
    }
}
