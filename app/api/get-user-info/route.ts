import { getUserByEmail, createUser } from "@/models/user";
import { respData, respErr } from "@/lib/resp";

import { User } from "@/types/user";
import { currentUser } from "@clerk/nextjs";
import { genUuid } from "@/lib";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return respErr("not login");
  }

  try {
    const email = user.emailAddresses[0].emailAddress;
    const nickname = user.firstName;
    const avatarUrl = user.imageUrl;

    let userInfo: User = {
      email: email,
      clerk_id: user.id,  
      nickname: nickname || "",
      avatar_url: avatarUrl,
      created_at: new Date(),
      uuid: genUuid(),
      id: user.id
    };

    const existUser = await getUserByEmail(email);
    if (existUser) {
      userInfo.uuid = existUser.uuid;
      userInfo.id = existUser.id;
    } else {
      await createUser(userInfo.email, userInfo.clerk_id, userInfo.nickname, userInfo.avatar_url);
    }

    return respData(userInfo);
  } catch (e) {
    console.log("get user info failed");
    return respErr("get user info failed");
  }
}
