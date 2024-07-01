import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { neynar } from "frog/middlewares";
import { handle } from "frog/vercel";
import { Box, Column, Image, Text, vars } from "../lib/ui.js";
import { getBuildData, getBuildNominations } from "./data.js";

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  ui: { vars },
  imageAspectRatio: "1:1",
  headers: {
    "cache-control": "max-age=0",
  },
  imageOptions: {
    height: 1024,
    width: 1024,
  },
  title: "Build Stats",
}).use(
  neynar({
    apiKey: process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS",
    features: ["interactor", "cast"],
  })
);

app.frame("/", (c) => {
  return c.res({
    image: (
      <Box
        gap="4"
        grow
        alignHorizontal="center"
        alignVertical="center"
        background="bg"
      >
        <Image
          width="72"
          height="72"
          src="https://build-frame.vercel.app/build_logo.png"
        ></Image>
        <Text align="center" size="64" color="white" font="title_display">
          Build Stats
        </Text>
        <Text size="16" color="white" align="end">
          by @yanvictorsn.eth
        </Text>
      </Box>
    ),
    intents: [
      <TextInput placeholder="Search by username or fid" />,
      <Button action="/stats">My Stats/🔍</Button>,
      <Button action="/nominators">Nominators</Button>,
    ],
  });
});

app.frame("/stats", async (c) => {
  const { fid } = c.var.interactor || {};
  const { inputText } = c;
  let user: string | undefined;
  if (inputText != "") {
    user = String(inputText);
  } else {
    user = String(fid);
  }

  return c.res({
    image: `/stats-img/${user}`,
    headers: {
      "cache-control": "max-age=0",
    },
    intents: [
      <TextInput placeholder="Search by username or fid" />,
      <Button action="/stats">My Stats / 🔍 Search</Button>,
      <Button action="/nominators">Nominators</Button>,
    ],
  });
});

app.image("/stats-img/:user", async (c) => {
  const { user } = c.req.param();
  const options = {
    method: "GET",
    headers: { accept: "application/json", api_key: "NEYNAR_API_DOCS" },
  };
  let buildData;
  let image;
  let username;
  if (/^\d+$/.test(user)) {
    const { address, imageData, usernameData } = await getUserFid(user);
    image = imageData;
    username = usernameData;
    buildData = await getBuildData(address);
  } else {
    const { address, imageData, usernameData } = await getUserNameData(user);
    image = imageData;
    username = usernameData;
    buildData = await getBuildData(address);
  }

  async function getUserNameData(user: string) {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${user}&viewer_fid=1&limit=1`,
      options
    );

    const data = await response.json();
    const address = data.result.users[0].verified_addresses.eth_addresses[0];
    const imageData = data.result.users[0].pfp_url;
    const usernameData = data.result.users[0].username;
    return { address, imageData, usernameData };
  }

  async function getUserFid(user: string) {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user}&viewer_fid=1`,
      options
    );

    const data = await response.json();
    console.log(data);
    const address = data.users[0].verified_addresses.eth_addresses[0];
    const imageData = data.users[0].pfp_url;
    const usernameData = data.users[0].username;
    return { address, imageData, usernameData };
  }

  return c.res({
    headers: {
      "cache-control": "max-age=0",
    },
    image: (
      <Box
        gap="16"
        grow
        flexDirection="column"
        alignHorizontal="center"
        alignVertical="center"
        background="bg"
        height="100%"
        padding="48"
      >
        <Text align="center" size="64" color="white" font="title_display">
          Build Stats
        </Text>
        <Box
          justifyContent="space-between"
          alignItems="center"
          backgroundColor="white"
          width="100%"
          borderColor="black"
          borderStyle="solid"
          borderWidth="2"
          boxShadow="10px 10px 0 0 black"
          grow
        >
          {/* Build Status */}
          <Box
            flexDirection="row"
            height="96"
            width="100%"
            gap="8"
            paddingTop="24"
            grow
            paddingBottom="30"
          >
            <Column
              flexDirection="column"
              alignContent="center"
              alignItems="center"
              justifyContent="center"
              width="2/4"
            >
              <Box justifyContent="center" alignItems="center">
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  gap="8"
                >
                  <Box justifyContent="center" alignItems="center">
                    <Image
                      width="64"
                      height="64"
                      borderRadius="48"
                      src={image}
                    ></Image>
                  </Box>
                  <Box justifyContent="center" gap="4" alignItems="flex-start">
                    <Text color="black" font="title_display" size="24">
                      @{username}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Column>
            <Column
              width="2/4"
              flexDirection="column"
              alignContent="center"
              alignItems="center"
              justifyContent="center"
              gap="4"
            >
              <Text color="blue" size="20" font="default">
                Rank
              </Text>
              <Text color="black" font="title_display" size="32">
                {buildData.rank !== undefined
                  ? String(buildData.rank)
                  : "No rank available"}
              </Text>
            </Column>
          </Box>
          {/* Line */}
          <Box
            background="white"
            paddingRight="16"
            paddingLeft="16"
            width="100%"
            height="2"
            grow
          >
            <Box background="black" width="100%" height="2"></Box>
          </Box>
          {/* Builder Data */}
          <Box
            width="100%"
            height="72"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            gap="14"
            grow
            paddingBottom="30"
          >
            <Text color="blue" font="default">
              Builder Data
            </Text>
            <Box
              width="100%"
              height="64"
              display="flex"
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
            >
              <Column justifyContent="center" alignItems="center" gap="4">
                {" "}
                <Text color="blue" size="20" font="default">
                  Budged
                </Text>
                <Text color="black" font="default_points" size="24">
                  {buildData.build_budget.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </Column>
              <Column justifyContent="center" alignItems="center" gap="4">
                {" "}
                <Text color="blue" size="20" font="default">
                  Score
                </Text>
                <Text color="black" font="default_points" size="24">
                  {buildData.build_score.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </Column>
            </Box>
          </Box>
          {/* Line 2 */}
          <Box
            background="white"
            paddingRight="16"
            paddingLeft="16"
            width="100%"
            height="2"
            grow
          >
            <Box background="black" width="100%" height="2"></Box>
          </Box>
          {/* Nominations Points */}
          <Box
            width="100%"
            height="72"
            justifyContent="center"
            alignItems="center"
            gap="14"
            paddingBottom="30"
            grow
          >
            <Text color="blue" font="default">
              Nomination Points
            </Text>
            <Box
              width="100%"
              height="64"
              display="flex"
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
            >
              <Column justifyContent="center" alignItems="center" gap="4">
                <Text color="blue" size="20" font="default">
                  Sent
                </Text>
                <Text color="black" font="default_points" size="24">
                  {String(buildData.nominations_given)}
                </Text>
              </Column>
              <Column justifyContent="center" alignItems="center" gap="4">
                <Text color="blue" size="20" font="default">
                  Earned
                </Text>
                <Text color="black" font="default_points" size="24">
                  {String(buildData.nominations_received)}
                </Text>
              </Column>
            </Box>
          </Box>
        </Box>
        <Box justifyContent="center" alignContent="center">
          <Image
            width="40"
            height="40"
            src="https://build-frame.vercel.app/build_logo.png"
          ></Image>
        </Box>
      </Box>
    ),
  });
});

app.frame("/nominators", async (c) => {
  const { fid } = c.var.interactor || {};
  const { inputText } = c;
  let user: string | undefined;
  if (inputText != "") {
    user = String(inputText);
  } else {
    user = String(fid);
  }

  return c.res({
    image: `/nominators/${user}`,
    intents: [
      <TextInput placeholder="Search by username or fid" />,
      <Button action="/stats">My Stats / 🔍 Search</Button>,
      <Button action="/nominators">Nominators</Button>,
    ],
  });
});

app.image("/nominators/:user", async (c) => {
  let { user } = c.req.param();
  const options = {
    method: "GET",
    headers: { accept: "application/json", api_key: "NEYNAR_API_DOCS" },
  };
  let buildNomination;
  if (/^\d+$/.test(user)) {
    const { address } = await getUserFid(user);
    buildNomination = await getBuildNominations(address);
  } else {
    const { address } = await getUserNameData(user);
    console.log("Entrou aqui no nome");
    buildNomination = await getBuildNominations(address);
  }

  async function getUserNameData(user: string) {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${user}&viewer_fid=1&limit=1`,
      options
    );

    const data = await response.json();
    const address = data.result.users[0].verified_addresses.eth_addresses[0];
    const imageData = data.result.users[0].pfp_url;
    const usernameData = data.result.users[0].username;
    console.log(data.result);
    return { address, imageData, usernameData };
  }

  async function getUserFid(user: string) {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user}&viewer_fid=1`,
      options
    );

    const data = await response.json();
    const address = data.users[0].verified_addresses.eth_addresses[0];
    const imageData = data.users[0].pfp_url;
    const usernameData = data.users[0].username;
    return { address, imageData, usernameData };
  }

  const nominatorsData = [];

  for (let index = 0; index < Math.min(3, buildNomination.length); index++) {
    nominatorsData.push(buildNomination[index]);
  }

  const fetchNominatorData = async (nominator: { originUsername: string }) => {
    const options = {
      method: "GET",
      headers: { accept: "application/json", api_key: "NEYNAR_API_DOCS" },
    };

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${nominator}&viewer_fid=1&limit=1`,
      options
    );
    const data = await response.json();
    return data.result.users[0];
  };

  const promises = nominatorsData.map((nominator) =>
    fetchNominatorData(nominator.originUsername)
  );

  const users = await Promise.all(promises);

  const usersData = [];

  for (let index = 0; index < users.length; index++) {
    usersData.push({
      userName: users[index].username,
      userImage: users[index].pfp_url,
    });
  }
  console.log(usersData);

  return c.res({
    image: (
      <Box
        gap="16"
        grow
        flexDirection="column"
        alignHorizontal="center"
        alignVertical="center"
        background="bg"
        height="100%"
        padding="48"
      >
        <Box>
          <Text align="center" size="32" color="white" font="title_display">
            My Top 3 Nominators
          </Text>
        </Box>
        <Box
          alignItems="center"
          backgroundColor="white"
          width="100%"
          borderColor="black"
          borderStyle="solid"
          borderWidth="2"
          boxShadow="10px 10px 0 0 black"
        >
          <Box
            width="100%"
            padding="60"
            grow
            flexDirection="row"
            justifyContent="center"
          >
            <Column width="1/3">
              <Box grow justifyContent="flex-end" alignItems="center" gap="4">
                <Box justifyContent="center" alignItems="center" gap="4">
                  <Image
                    width="64"
                    height="64"
                    borderRadius="160"
                    src={usersData[1].userImage}
                  ></Image>
                  <Text font="title_display" size="18">
                    #{nominatorsData[1].originRank}
                  </Text>
                  <Text font="title_display" size="20">
                    {usersData[1].userName}
                  </Text>
                </Box>
                <Box
                  backgroundColor="bg"
                  width="128"
                  height="160"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white" size="48">
                    2
                  </Text>
                </Box>
              </Box>
            </Column>
            <Column width="1/3">
              <Box grow justifyContent="flex-end" alignItems="center" gap="4">
                <Box justifyContent="center" alignItems="center" gap="4">
                  <Image
                    width="64"
                    height="64"
                    borderRadius="160"
                    src={usersData[0].userImage}
                  ></Image>
                  <Text font="title_display" size="18">
                    #{nominatorsData[0].originRank}
                  </Text>
                  <Text font="title_display" size="20">
                    {usersData[0].userName}
                  </Text>
                </Box>
                <Box
                  backgroundColor="bg"
                  width="128"
                  height="224"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white" size="48">
                    1
                  </Text>
                </Box>
              </Box>
            </Column>
            <Column width="1/3">
              {" "}
              <Box grow justifyContent="flex-end" alignItems="center" gap="4">
                <Box justifyContent="center" alignItems="center" gap="4">
                  <Image
                    width="64"
                    height="64"
                    borderRadius="160"
                    src={usersData[2].userImage}
                  ></Image>
                  <Text font="title_display" size="18">
                    #{nominatorsData[2].originRank}
                  </Text>
                  <Text font="title_display" size="20">
                    {usersData[2].userName}
                  </Text>
                </Box>
                <Box
                  backgroundColor="bg"
                  width="128"
                  height="128"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white" size="48">
                    3
                  </Text>
                </Box>
              </Box>
            </Column>
          </Box>
        </Box>
        <Box justifyContent="center" alignContent="center" paddingTop="18">
          <Image
            width="40"
            height="40"
            src="https://build-frame.vercel.app/build_logo.png"
          ></Image>
        </Box>
      </Box>
    ),
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
