import dotenv from "dotenv";
dotenv.config();

export async function getBuildData(address: string) {
  try {
    const response = await fetch(
      `https://build.top/api/stats?wallet=${address}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const buildData = await response.json();
    return buildData;
  } catch (error) {
    console.error("Error fetching build data:", error);
  }
}

export async function getBuildNominations(address: string) {
  try {
    const response = await fetch(
      `https://build.top/api/top_nominations_received?wallet=${address}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("Build");
    const buildNominations = await response.json();
    return buildNominations;
  } catch (error) {
    console.error("Error fetching build data:", error);
  }
}
