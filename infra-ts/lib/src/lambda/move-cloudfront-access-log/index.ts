import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { EventBridgeEvent } from "aws-lambda";

interface EventObjectCreated {
  version: string;
  bucket: {
    name: string;
  };
  object: {
    key: string;
    size: number;
    etag: string;
    "version-id": string;
    sequencer: string;
  };
  "request-id": string;
  requester: string;
  "source-ip-address": string;
  reason: "PutObject";
}

const s3 = new S3Client();

const targetKeyPrefix = process.env.TARGET_KEY_PREFIX;

const hiveCompatiblePartitions = process.env.HIVE_COMPATIBLE_PARTITIONS;

// regex for filenames by Amazon CloudFront access logs. Groups:
// 1. year
// 2. month
// 3. day
// 4. hour
const datePattern = "[^\\d](\\d{4})-(\\d{2})-(\\d{2})-(\\d{2})[^\\d]";
const filenamePattern = "[^/]+$";

export const handler = async (
  event: EventBridgeEvent<"Object Created", EventObjectCreated>
) => {
  const bucket = event.detail.bucket.name;
  const sourceKey = event.detail.object.key;

  const sourceRegex = new RegExp(datePattern, "g");
  const match = sourceRegex.exec(sourceKey);

  if (match == null) {
    console.log(`Object key ${sourceKey} does not look like an access log file, so it will not be moved.`);
    return;
  }

  const [, year, month, day, hour] = match;

  const filenameRegex = new RegExp(filenamePattern, "g");
  const filenameRegExpExecArray = filenameRegex.exec(sourceKey);

  if (filenameRegExpExecArray === null) {
    console.log(`Object key ${sourceKey} does not look like an access log file, so it will not be moved.`);
    return;
  }

  const filename = filenameRegExpExecArray[0];

  let targetKey;
  if (hiveCompatiblePartitions === "true") {
    targetKey = `${targetKeyPrefix}year=${year}/month=${month}/day=${day}/hour=${hour}/${filename}`;
  } else {
    targetKey = `${targetKeyPrefix}${year}/${month}/${day}/${hour}/${filename}`;
  }

  console.log(`Copying ${sourceKey} to ${targetKey}.`);

  const copyParams = {
    CopySource: `${bucket}/${sourceKey}`,
    Bucket: bucket,
    Key: targetKey,
  };

  try {
    await s3.send(new CopyObjectCommand(copyParams));
  } catch (err) {
    Error(`Error while copying ${sourceKey}: ${err}`);
  }

  console.log(`Copied. Now deleting ${sourceKey}.`);

  const deleteParams = { Bucket: bucket, Key: sourceKey };

  try {
    await s3.send(new DeleteObjectCommand(deleteParams));
  } catch (err) {
    throw new Error(`Error while deleting ${sourceKey}: ${err}`);
  }
  console.log(`Deleted ${sourceKey}.`);
}
