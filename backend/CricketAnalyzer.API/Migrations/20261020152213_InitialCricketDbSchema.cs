using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CricketAnalyzer.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCricketDbSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Matches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExternalMatchId = table.Column<string>(type: "text", nullable: true),
                    Format = table.Column<string>(type: "text", nullable: false),
                    MatchDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Team1 = table.Column<string>(type: "text", nullable: false),
                    Team2 = table.Column<string>(type: "text", nullable: false),
                    Venue = table.Column<string>(type: "text", nullable: true),
                    Result = table.Column<string>(type: "text", nullable: true),
                    Season = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    BattingStyle = table.Column<string>(type: "text", nullable: true),
                    BowlingStyle = table.Column<string>(type: "text", nullable: true),
                    DateOfBirth = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExternalApiId = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BattingPerformances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    MatchId = table.Column<int>(type: "integer", nullable: false),
                    InningsNumber = table.Column<int>(type: "integer", nullable: false),
                    RunsScored = table.Column<int>(type: "integer", nullable: false),
                    BallsFaced = table.Column<int>(type: "integer", nullable: false),
                    Fours = table.Column<int>(type: "integer", nullable: false),
                    Sixes = table.Column<int>(type: "integer", nullable: false),
                    StrikeRate = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    IsOut = table.Column<bool>(type: "boolean", nullable: false),
                    DismissalType = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BattingPerformances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BattingPerformances_Matches_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BattingPerformances_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BowlingPerformances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    MatchId = table.Column<int>(type: "integer", nullable: false),
                    InningsNumber = table.Column<int>(type: "integer", nullable: false),
                    OversBowled = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: false),
                    Maidens = table.Column<int>(type: "integer", nullable: false),
                    RunsConceded = table.Column<int>(type: "integer", nullable: false),
                    WicketsTaken = table.Column<int>(type: "integer", nullable: false),
                    EconomyRate = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    Wides = table.Column<int>(type: "integer", nullable: false),
                    NoBalls = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BowlingPerformances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BowlingPerformances_Matches_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BowlingPerformances_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlayerStatistics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Format = table.Column<string>(type: "text", nullable: false),
                    MatchesPlayed = table.Column<int>(type: "integer", nullable: false),
                    TotalRuns = table.Column<int>(type: "integer", nullable: false),
                    BattingAverage = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    StrikeRate = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    HighestScore = table.Column<int>(type: "integer", nullable: false),
                    Centuries = table.Column<int>(type: "integer", nullable: false),
                    Fifties = table.Column<int>(type: "integer", nullable: false),
                    TotalWickets = table.Column<int>(type: "integer", nullable: false),
                    BowlingAverage = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    BowlingEconomy = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    BestBowlingFigures = table.Column<string>(type: "text", nullable: true),
                    LastCalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerStatistics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerStatistics_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AIAnalyses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Strengths = table.Column<string>(type: "text", nullable: false),
                    Weaknesses = table.Column<string>(type: "text", nullable: false),
                    RecentFormTrend = table.Column<string>(type: "text", nullable: false),
                    Recommendations = table.Column<string>(type: "text", nullable: false),
                    FullReportMarkdown = table.Column<string>(type: "text", nullable: false),
                    ModelUsed = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIAnalyses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIAnalyses_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AIAnalyses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIAnalyses_PlayerId",
                table: "AIAnalyses",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_AIAnalyses_UserId",
                table: "AIAnalyses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BattingPerformances_MatchId",
                table: "BattingPerformances",
                column: "MatchId");

            migrationBuilder.CreateIndex(
                name: "IX_BattingPerformances_PlayerId",
                table: "BattingPerformances",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_BowlingPerformances_MatchId",
                table: "BowlingPerformances",
                column: "MatchId");

            migrationBuilder.CreateIndex(
                name: "IX_BowlingPerformances_PlayerId",
                table: "BowlingPerformances",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_ExternalMatchId",
                table: "Matches",
                column: "ExternalMatchId");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_MatchDate",
                table: "Matches",
                column: "MatchDate");

            migrationBuilder.CreateIndex(
                name: "IX_Players_Country",
                table: "Players",
                column: "Country");

            migrationBuilder.CreateIndex(
                name: "IX_Players_ExternalApiId",
                table: "Players",
                column: "ExternalApiId");

            migrationBuilder.CreateIndex(
                name: "IX_Players_Name",
                table: "Players",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerStatistics_PlayerId",
                table: "PlayerStatistics",
                column: "PlayerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIAnalyses");

            migrationBuilder.DropTable(
                name: "BattingPerformances");

            migrationBuilder.DropTable(
                name: "BowlingPerformances");

            migrationBuilder.DropTable(
                name: "PlayerStatistics");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Matches");

            migrationBuilder.DropTable(
                name: "Players");
        }
    }
}
