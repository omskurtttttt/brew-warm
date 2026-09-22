import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("=== Running Spatial Search Engine Verifications ===");

  // 1. Spatial Search Query: Legazpi Center (13.1391, 123.7438) with radius 3000m
  const centerLat = 13.1391;
  const centerLng = 123.7438;
  const radiusMeters = 3000;

  console.log(`\n1. Testing PostGIS ST_DWithin search near (${centerLat}, ${centerLng}), radius: ${radiusMeters}m...`);

  const nearbyShops = await sql`
    SELECT 
      s.id,
      s.osm_id,
      s.name,
      s.lat,
      s.lng,
      s.address,
      ROUND(ST_Distance(s.location, ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography)::numeric, 1) as distance_meters,
      COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,
      COUNT(r.id)::int as review_count
    FROM shops s
    LEFT JOIN reviews r ON s.id = r.shop_id
    WHERE ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography, ${radiusMeters})
    GROUP BY s.id
    ORDER BY distance_meters ASC
    LIMIT 5;
  `;

  console.log(`-> Found ${nearbyShops.length} shops within ${radiusMeters}m:`);
  for (const shop of nearbyShops) {
    console.log(`   - [${shop.id}] ${shop.name}: ${shop.distance_meters}m away | Rating: ${shop.avg_rating} (${shop.review_count} reviews)`);
  }

  if (nearbyShops.length === 0) {
    throw new Error("No shops returned from spatial query! Expected Legazpi shops to be found.");
  }

  // Verify distance ordering
  for (let i = 1; i < nearbyShops.length; i++) {
    const prev = parseFloat(nearbyShops[i - 1].distance_meters);
    const curr = parseFloat(nearbyShops[i].distance_meters);
    if (curr < prev) {
      throw new Error(`Shops not sorted by distance! ${prev}m came before ${curr}m`);
    }
  }
  console.log("-> Distance ascending order verified!");

  // 2. Test Single Shop Detail Query with Review Aggregation
  const testShopId = nearbyShops[0].id;
  console.log(`\n2. Testing Single Shop Detail Query for Shop #${testShopId} (${nearbyShops[0].name})...`);

  // Insert a test user and review
  const testEmail = "spatial_verify_user@example.com";
  await sql`DELETE FROM users WHERE email = ${testEmail};`;
  const [testUser] = await sql`
    INSERT INTO users (email, password_hash, role)
    VALUES (${testEmail}, 'hash_dummy_test', 'user')
    RETURNING id;
  `;

  const [testReview] = await sql`
    INSERT INTO reviews (user_id, shop_id, rating, comment)
    VALUES (${testUser.id}, ${testShopId}, 5, 'Best espresso in town!')
    RETURNING id, rating;
  `;
  console.log(`-> Created temporary review with rating ${testReview.rating}`);

  // Query shop with computed average rating
  const [shopDetail] = await sql`
    SELECT 
      s.id,
      s.name,
      COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,
      COUNT(r.id)::int as review_count
    FROM shops s
    LEFT JOIN reviews r ON s.id = r.shop_id
    WHERE s.id = ${testShopId}
    GROUP BY s.id;
  `;

  console.log(`-> Computed Shop Detail: Rating ${shopDetail.avg_rating}, Reviews: ${shopDetail.review_count}`);
  if (parseFloat(shopDetail.avg_rating) < 4.0 || shopDetail.review_count < 1) {
    throw new Error(`Expected avg_rating to reflect review, got: ${shopDetail.avg_rating}`);
  }

  // 3. Test Sorting by Rating
  console.log("\n3. Testing ?sort=rating order...");
  const ratingSortedShops = await sql`
    SELECT 
      s.id,
      s.name,
      ROUND(ST_Distance(s.location, ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography)::numeric, 1) as distance_meters,
      COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,
      COUNT(r.id)::int as review_count
    FROM shops s
    LEFT JOIN reviews r ON s.id = r.shop_id
    WHERE ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography, ${radiusMeters})
    GROUP BY s.id
    ORDER BY avg_rating DESC, distance_meters ASC
    LIMIT 3;
  `;

  console.log(`-> Top rated shop in search area: ${ratingSortedShops[0].name} (Rating: ${ratingSortedShops[0].avg_rating})`);
  if (ratingSortedShops[0].id !== testShopId) {
    throw new Error(`Expected shop #${testShopId} to be #1 when sorted by rating!`);
  }
  console.log("-> Rating sort verified!");

  // Clean up test user & review
  await sql`DELETE FROM reviews WHERE id = ${testReview.id};`;
  await sql`DELETE FROM users WHERE id = ${testUser.id};`;
  console.log("\n4. Cleanup completed.");

  console.log("\n=== Spatial Search Engine Verifications Succeeded! ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
