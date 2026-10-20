using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HireConnect.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminAuditLogsSystemSettingsAndLocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reports_UserId",
                table: "Reports");

            migrationBuilder.AlterColumn<string>(
                name: "Reason",
                table: "Reports",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Reports",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "AdminNote",
                table: "Reports",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAt",
                table: "Reports",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResolvedByAdminId",
                table: "Reports",
                type: "varchar(255)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ReviewId",
                table: "Reports",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AdminAuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AdminId = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Action = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TargetType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TargetId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Details = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpHash = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminAuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdminAuditLogs_AspNetUsers_AdminId",
                        column: x => x.AdminId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            // Database-level immutability triggers for AdminAuditLogs
            migrationBuilder.Sql(@"
                CREATE TRIGGER trg_adminauditlogs_prevent_update
                BEFORE UPDATE ON AdminAuditLogs
                FOR EACH ROW
                BEGIN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'AdminAuditLogs records are immutable and cannot be updated.';
                END;
            ");

            migrationBuilder.Sql(@"
                CREATE TRIGGER trg_adminauditlogs_prevent_delete
                BEFORE DELETE ON AdminAuditLogs
                FOR EACH ROW
                BEGIN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'AdminAuditLogs records are immutable and cannot be deleted.';
                END;
            ");

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StateOrProvince = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Country = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Key = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Value = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedByAdminId = table.Column<string>(type: "varchar(255)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SystemSettings_AspNetUsers_UpdatedByAdminId",
                        column: x => x.UpdatedByAdminId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "Locations",
                columns: new[] { "Id", "Country", "CreatedAt", "IsActive", "Name", "StateOrProvince" },
                values: new object[,]
                {
                    { 1, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Colombo", "Western" },
                    { 2, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Kandy", "Central" },
                    { 3, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Galle", "Southern" },
                    { 4, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Jaffna", "Northern" },
                    { 5, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Gampaha", "Western" },
                    { 6, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Negombo", "Western" },
                    { 7, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Kurunegala", "North Western" },
                    { 8, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Batticaloa", "Eastern" },
                    { 9, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Matara", "Southern" },
                    { 10, "Sri Lanka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Anuradhapura", "North Central" }
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Description", "Key", "UpdatedAt", "UpdatedByAdminId", "Value" },
                values: new object[,]
                {
                    { 1, "Fee charged for posting a job in LKR", "JobPostingFee", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "5000.00" },
                    { 2, "Platform maintenance mode toggle (true/false)", "MaintenanceMode", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "false" },
                    { 3, "Platform public display name", "PlatformName", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "HireConnect" },
                    { 4, "Platform support contact email", "ContactEmail", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "support@hireconnect.com" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ResolvedByAdminId",
                table: "Reports",
                column: "ResolvedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ReviewId",
                table: "Reports",
                column: "ReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId_CreatedAt",
                table: "Reports",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId_JobId",
                table: "Reports",
                columns: new[] { "UserId", "JobId" });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId_ReviewId",
                table: "Reports",
                columns: new[] { "UserId", "ReviewId" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminAuditLogs_Action_CreatedAt",
                table: "AdminAuditLogs",
                columns: new[] { "Action", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminAuditLogs_AdminId_CreatedAt",
                table: "AdminAuditLogs",
                columns: new[] { "AdminId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminAuditLogs_CreatedAt",
                table: "AdminAuditLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_Name",
                table: "Locations",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemSettings_Key",
                table: "SystemSettings",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemSettings_UpdatedByAdminId",
                table: "SystemSettings",
                column: "UpdatedByAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_AspNetUsers_ResolvedByAdminId",
                table: "Reports",
                column: "ResolvedByAdminId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_CompanyReviews_ReviewId",
                table: "Reports",
                column: "ReviewId",
                principalTable: "CompanyReviews",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_AspNetUsers_ResolvedByAdminId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_CompanyReviews_ReviewId",
                table: "Reports");

            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_adminauditlogs_prevent_update;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_adminauditlogs_prevent_delete;");

            migrationBuilder.DropTable(
                name: "AdminAuditLogs");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropIndex(
                name: "IX_Reports_ResolvedByAdminId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_ReviewId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_UserId_CreatedAt",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_UserId_JobId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_UserId_ReviewId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "AdminNote",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ResolvedAt",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ResolvedByAdminId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ReviewId",
                table: "Reports");

            migrationBuilder.AlterColumn<string>(
                name: "Reason",
                table: "Reports",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Reports",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId",
                table: "Reports",
                column: "UserId");
        }
    }
}
