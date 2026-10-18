using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireConnect.API.Migrations
{
    /// <inheritdoc />
    public partial class AddJobSecurityAndViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ClosedByAdmin",
                table: "Jobs",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "Jobs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "JobViews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    JobId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "varchar(450)", maxLength: 450, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpHash = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ViewedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobViews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobViews_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_JobViews_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_JobViews_JobId_ViewedDate_IpHash",
                table: "JobViews",
                columns: new[] { "JobId", "ViewedDate", "IpHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobViews_JobId_ViewedDate_UserId",
                table: "JobViews",
                columns: new[] { "JobId", "ViewedDate", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobViews_UserId",
                table: "JobViews",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobViews");

            migrationBuilder.DropColumn(
                name: "ClosedByAdmin",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "Jobs");
        }
    }
}
