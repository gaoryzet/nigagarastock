import json
from pathlib import Path

try:
    import FinanceDataReader as fdr
except ImportError as exc:
    raise SystemExit(
        "FinanceDataReader가 필요합니다. 먼저 실행하세요:\n"
        "pip install finance-datareader"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "krx-stocks.json"


def market_suffix(market: str) -> str:
    return ".KS" if market == "KOSPI" else ".KQ"


frames = []
for market in ["KOSPI", "KOSDAQ"]:
    df = fdr.StockListing(market)
    df = df[["Code", "Name"]].copy()
    df["Market"] = market
    frames.append(df)

rows = []
for df in frames:
    for _, row in df.iterrows():
        symbol = str(row["Code"]).zfill(6)
        market = str(row["Market"])
        rows.append(
            {
                "symbol": symbol,
                "ySymbol": f"{symbol}{market_suffix(market)}",
                "name": str(row["Name"]),
                "market": market,
            }
        )

rows.sort(key=lambda item: (item["market"], item["name"]))
OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {len(rows)} stocks to {OUT}")
