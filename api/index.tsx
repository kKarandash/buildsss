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

// Конфигурация координат для текста и изображения
const textPositions = {
  username: { left: '500px', top: '500px' },
  rank: { left: '500px', top: '500px' },
  budget: { left: '500px', top: '500px' },
  score: { left: '500px', top: '500px' },
  nominationsGiven: { left: '500px', top: '500px' },
  nominationsReceived: { left: '500px', top: '500px' },
  image: { left: '100px', top: '100px' }, // Добавлена позиция для изображения
};

app.frame("/", (c) => {
  return c.res({
    image: (
      <Box
        gap="4"
        grow
        alignHorizontal="center"
        alignVertical="center"
        background="bg"
        position="relative"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          overflow="hidden"
          zIndex="0"
        >
          <Image
            src="https://i.imgur.com/lNHAp4t.png"
            width="100%"
            height="auto"
          />
        </Box>
        <Box zIndex="2">
          <Image
            width="72"
            height="72"
            src="https://build-frame.vercel.app/build_logo.png"
          />
        </Box>
        <div style={{ position: 'absolute', right: '20px', bottom: '20px', backgroundColor: 'transparent', display: 'flex', zIndex: '2' }}>
          <Text size="16" color="white" align="end">
            by @yanvictorsn.eth
          </Text>
        </div>
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
      <Button action={`/share/${user}`}>Share</Button>
    ],
  });
});

app.image("/stats-img/:user", async (c) => {
  const { user }: { user: string } = c.req.param();
  const options = {
    method: "GET",
    headers: { accept: "application/json", api_key: process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS" },
  };
  let buildData;
  let image: string;
  let username: string;
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
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(user)}&viewer_fid=1&limit=1`,
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
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${encodeURIComponent(user)}&viewer_fid=1`,
      options
    );

    const data = await response.json();
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
      <Box position="relative">
        <Box
          width="100%"
          height="auto"
          zIndex="0"
        >
          <Image
            src="https://i.imgur.com/lNHAp4t.png"
            width="100%"
            height="auto"
          />
        </Box>
        <div
          style={{
            position: 'absolute',
            left: textPositions.image.left,
            top: textPositions.image.top,
            zIndex: '2',
            display: 'flex', // Добавлено свойство display
          }}
        >
          <Image
            width="64"
            height="64"
            borderRadius="48"
            src={image}
          />
        </div>
        <div style={{ position: 'absolute', left: textPositions.username.left, top: textPositions.username.top, backgroundColor: 'transparent', zIndex: '2', display: 'flex' }}>
          <Text color="black" font="title_display" size="24">
            @{username}
          </Text>
        </div>
        <div
          style={{
            position: "absolute",
            top: textPositions.rank.top,
            left: textPositions.rank.left,
            zIndex: "2",
            display: 'flex',
          }}
        >
          <Text color="black" font="title_display" size="32">
            {buildData.rank !== undefined
              ? String(buildData.rank)
              : "No rank available"}
          </Text>
        </div>
        <div
          style={{
            position: "absolute",
            top: textPositions.score.top,
            left: textPositions.score.left,
            zIndex: "2",
            display: 'flex',
          }}
        >
          <Text color="black" font="default_points" size="24">
            {buildData.build_score.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </div>
        <div
          style={{
            position: "absolute",
            top: textPositions.budget.top,
            left: textPositions.budget.left,
            zIndex: "2",
            display: 'flex',
          }}
        >
          <Text color="black" font="default_points" size="24">
            {buildData.build_budget.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </div>
        <div
          style={{
            position: "absolute",
            top: textPositions.nominationsGiven.top,
            left: textPositions.nominationsGiven.left,
            zIndex: "2",
            display: 'flex',
          }}
        >
          <Text color="black" font="default_points" size="24">
            {String(buildData.nominations_given)}
          </Text>
        </div>
        <div
          style={{
            position: "absolute",
            top: textPositions.nominationsReceived.top,
            left: textPositions.nominationsReceived.left,
            zIndex: "2",
            display: 'flex',
          }}
        >
          <Text color="black" font="default_points" size="24">
            {String(buildData.nominations_received)}
          </Text>
        </div>
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
  let { user }: { user: string } = c.req.param();
  const options = {
    method: "GET",
    headers: { accept: "application/json", api_key: process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS" },
  };
  let buildNomination;
  if (/^\d+$/.test(user)) {
    const { address } = await getUserFid(user);
    buildNomination = await getBuildNominations(address);
  } else {
    const { address } = await getUserNameData(user);
    buildNomination = await getBuildNominations(address);
  }

  async function getUserNameData(user: string) {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(user)}&viewer_fid=1&limit=1`,
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
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${encodeURIComponent(user)}&viewer_fid=1`,
      options
    );

    const data = await response.json();
    const address = data.users[0].verified_addresses.eth_addresses[0];
    const imageData = data.users[0].pfp_url;
    const usernameData = data.users[0].username;
    return { address, imageData, usernameData };
  }

  const nominatorsData: { originUsername: string; originRank: number }[] = [];

  for (let index = 0; index < Math.min(3, buildNomination.length); index++) {
    nominatorsData.push(buildNomination[index]);
  }

  const fetchNominatorData = async (nominator: { originUsername: string }) => {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(nominator.originUsername)}&viewer_fid=1&limit=1`,
      options
    );
    const data = await response.json();
    return data.result.users[0];
  };

  const promises = nominatorsData.map((nominator) =>
    fetchNominatorData(nominator)
  );

  const users = await Promise.all(promises);

  const usersData = [];

  for (let index = 0; index < users.length; index++) {
    usersData.push({
      userName: users[index].username,
      userImage: users[index].pfp_url,
    });
  }

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
                  />
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
                  display="flex" // Добавлено свойство display
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
                  />
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
                  display="flex" // Добавлено свойство display
                >
                  <Text color="white" size="48">
                    1
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
                    src={usersData[2].userImage}
                  />
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
                  display="flex" // Добавлено свойство display
                >
                  <Text color="white" size="48">
                    3
                  </Text>
                </Box>
              </Box>
            </Column>
          </Box>
        </Box>
        <Box justifyContent="center" alignContent="center" paddingTop="18" display="flex">
          <Image
            width="40"
            height="40"
            src="https://build-frame.vercel.app/build_logo.png"
          />
        </Box>
      </Box>
    ),
  });
});

app.frame("/share/:user", async (c) => {
  const { user }: { user: string } = c.req.param();
  const warpcastUrl = `https://warpcast.com/~/compose?text=Check%20out%20my%20stats!%20https://buildsss.vercel.app/api/stats-img/${encodeURIComponent(user)}`;
  return c.res({
    image: `/stats-img/${user}`,
    intents: [
      <Button action={warpcastUrl}>Click here to share on Warpcast</Button>
    ]
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
