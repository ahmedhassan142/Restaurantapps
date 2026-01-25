// scripts/seedMenuData.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Category from '@/models/category';
import MenuItem from '@/models/menu';
import FeaturedItem from '@/models/Featureditem';

// First, let's create some sample categories using your hierarchical model
const sampleCategories = [
  // Main Categories (Level 0)
  {
    name: 'Starters & Appetizers',
    description: 'Perfect beginnings to your dining experience',
    image: '/images/starters.jpg',
    parent: null,
    isActive: true,
    order: 1,
    slug: 'starters-appetizers'
  },
  {
    name: 'Main Courses',
    description: 'Hearty and delicious main dishes',
    image: '/images/main-courses.jpg',
    parent: null,
    isActive: true,
    order: 2,
    slug: 'main-courses'
  },
  {
    name: 'Desserts',
    description: 'Sweet endings to your perfect meal',
    image: '/images/desserts.jpg',
    parent: null,
    isActive: true,
    order: 3,
    slug: 'desserts'
  },
  {
    name: 'Beverages',
    description: 'Refreshing drinks and beverages',
    image: '/images/beverages.jpg',
    parent: null,
    isActive: true,
    order: 4,
    slug: 'beverages'
  }
];

// Sample menu items - FIXED preparation times (all >= 5 minutes)
const sampleMenuItems = [
  // Starters
  {
    name: 'Truffle Arancini',
    description: 'Crispy risotto balls filled with mozzarella and black truffle, served with marinara sauce',
    price: 14.99,
    image: '/images/truffle-arancini.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    ingredients: ['Arborio rice', 'Mozzarella', 'Black truffle', 'Bread crumbs', 'Marinara sauce'],
    preparationTime: 15, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 320,
      protein: 8,
      carbs: 45,
      fat: 12
    },
    tags: ['popular', 'signature', 'chef-special']
  },
  {
    name: 'Spicy Tuna Tartare',
    description: 'Fresh yellowfin tuna with avocado, cucumber, and spicy mayo, served with wonton chips',
    price: 16.99,
    image: '/images/tuna-tartare.jpg',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: true,
    ingredients: ['Yellowfin tuna', 'Avocado', 'Cucumber', 'Spicy mayo', 'Sesame oil', 'Wonton chips'],
    preparationTime: 10, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 280,
      protein: 22,
      carbs: 18,
      fat: 14
    },
    tags: ['fresh', 'spicy', 'seafood']
  },
  {
    name: 'Burrata Caprese',
    description: 'Creamy burrata cheese with heirloom tomatoes, fresh basil, and balsamic glaze',
    price: 15.99,
    image: '/images/burrata-caprese.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: false,
    ingredients: ['Burrata cheese', 'Heirloom tomatoes', 'Fresh basil', 'Extra virgin olive oil', 'Balsamic glaze'],
    preparationTime: 8, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 240,
      protein: 10,
      carbs: 12,
      fat: 18
    },
    tags: ['vegetarian', 'fresh', 'italian']
  },

  // Main Courses
  {
    name: 'Wagyu Beef Burger',
    description: 'Premium wagyu beef patty with aged cheddar, caramelized onions, and truffle aioli on brioche bun',
    price: 28.99,
    image: '/images/wagyu-burger.jpg',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    ingredients: ['Wagyu beef', 'Brioche bun', 'Aged cheddar', 'Caramelized onions', 'Truffle aioli', 'Lettuce', 'Tomato'],
    preparationTime: 20, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 780,
      protein: 45,
      carbs: 52,
      fat: 42
    },
    tags: ['signature', 'premium', 'beef']
  },
  {
    name: 'Truffle Mushroom Risotto',
    description: 'Creamy arborio rice with wild mushrooms, parmesan, and white truffle oil',
    price: 24.99,
    image: '/images/truffle-risotto.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: false,
    ingredients: ['Arborio rice', 'Wild mushrooms', 'Parmesan cheese', 'White truffle oil', 'Vegetable stock', 'White wine'],
    preparationTime: 25, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 420,
      protein: 12,
      carbs: 58,
      fat: 16
    },
    tags: ['vegetarian', 'comfort-food', 'italian']
  },
  {
    name: 'Grilled Atlantic Salmon',
    description: 'Fresh salmon fillet with lemon herb butter, roasted vegetables, and quinoa pilaf',
    price: 32.99,
    image: '/images/grilled-salmon.jpg',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: false,
    ingredients: ['Atlantic salmon', 'Lemon herb butter', 'Seasonal vegetables', 'Quinoa', 'Fresh herbs'],
    preparationTime: 18, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 480,
      protein: 38,
      carbs: 22,
      fat: 26
    },
    tags: ['healthy', 'seafood', 'gluten-free']
  },
  {
    name: 'Herb Crusted Chicken',
    description: 'Free-range chicken breast with herb crust, mashed potatoes, and seasonal vegetables',
    price: 22.99,
    image: '/images/herb-chicken.jpg',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    ingredients: ['Chicken breast', 'Fresh herbs', 'Mashed potatoes', 'Seasonal vegetables', 'Pan jus'],
    preparationTime: 22, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 420,
      protein: 35,
      carbs: 28,
      fat: 18
    },
    tags: ['classic', 'comfort-food', 'poultry']
  },

  // Desserts
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla bean ice cream',
    price: 12.99,
    image: '/images/lava-cake.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Sugar', 'Flour', 'Vanilla ice cream'],
    preparationTime: 15, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 380,
      protein: 6,
      carbs: 52,
      fat: 18
    },
    tags: ['chocolate', 'popular', 'warm']
  },
  {
    name: 'Tiramisu',
    description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream',
    price: 10.99,
    image: '/images/tiramisu.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    ingredients: ['Mascarpone', 'Ladyfingers', 'Espresso', 'Cocoa powder', 'Eggs', 'Sugar'],
    preparationTime: 5, // FIXED: Changed from 0 to 5 minutes
    nutritionalInfo: {
      calories: 320,
      protein: 8,
      carbs: 38,
      fat: 16
    },
    tags: ['classic', 'coffee', 'italian']
  },

  // Beverages
  {
    name: 'Signature Craft Cocktail',
    description: 'Our signature blend of premium gin, fresh lime, elderflower, and cucumber',
    price: 14.99,
    image: '/images/craft-cocktail.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isSpicy: false,
    ingredients: ['Premium gin', 'Fresh lime', 'Elderflower liqueur', 'Cucumber', 'Mint'],
    preparationTime: 5, // FIXED: Was already correct
    tags: ['signature', 'refreshing', 'alcoholic']
  },
  {
    name: 'Fresh Berry Smoothie',
    description: 'Blend of fresh strawberries, blueberries, banana, and Greek yogurt',
    price: 8.99,
    image: '/images/berry-smoothie.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    isSpicy: false,
    ingredients: ['Strawberries', 'Blueberries', 'Banana', 'Greek yogurt', 'Honey'],
    preparationTime: 5, // FIXED: Was already correct
    nutritionalInfo: {
      calories: 180,
      protein: 6,
      carbs: 32,
      fat: 2
    },
    tags: ['healthy', 'refreshing', 'fruit']
  },
  {
    name: 'Premium Coffee Selection',
    description: 'Freshly brewed coffee from single-origin beans',
    price: 4.99,
    image: '/images/premium-coffee.jpg',
    isAvailable: true,
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isSpicy: false,
    ingredients: ['Arabica coffee beans', 'Filtered water'],
    preparationTime: 5, // FIXED: Changed from 3 to 5 minutes
    tags: ['hot', 'caffeine', 'premium']
  }
];

const sampleFeaturedItems = [
  {
    menuItem: '', // Will be populated
    title: 'Chef\'s Special',
    description: 'Our signature wagyu burger with truffle aioli',
    isActive: true,
    order: 1,
    badgeText: 'Popular',
    badgeColor: 'red'
  },
  {
    menuItem: '', // Will be populated
    title: 'Vegetarian Delight',
    description: 'Creamy truffle mushroom risotto',
    isActive: true,
    order: 2,
    badgeText: 'Vegetarian',
    badgeColor: 'green'
  },
  {
    menuItem: '', // Will be populated
    title: 'Sweet Indulgence',
    description: 'Warm chocolate lava cake',
    isActive: true,
    order: 3,
    badgeText: 'Dessert',
    badgeColor: 'orange'
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    
    console.log('Clearing existing menu data...');
    // Only clear menu items and featured items, keep existing categories if any
    await MenuItem.deleteMany({});
    await FeaturedItem.deleteMany({});

    // Check if we already have categories
    const existingCategories = await Category.find({});
    
    let categories;
    if (existingCategories.length === 0) {
      console.log('Creating categories...');
      categories = await Category.insertMany(sampleCategories);
      console.log(`Created ${categories.length} categories`);
    } else {
      console.log(`Using existing ${existingCategories.length} categories`);
      categories = existingCategories;
    }

    // Create a map of category names to their IDs
    const categoryMap: { [key: string]: any } = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat;
    });

    console.log('Creating menu items...');
    
    // Validate preparation times before inserting
    const validatedMenuItems = sampleMenuItems.map(item => {
      // Ensure preparationTime is at least 5
      if (item.preparationTime < 5) {
        console.log(`⚠️  Fixing preparation time for ${item.name}: ${item.preparationTime} -> 5`);
        item.preparationTime = 5;
      }
      return item;
    });
    
    // Assign categories to menu items based on type
    const menuItemsWithCategories = validatedMenuItems.map(item => {
      let category;
      
      if (item.price <= 18 && !item.name.includes('Cocktail') && !item.name.includes('Coffee')) {
        category = categoryMap['Starters & Appetizers'];
      } else if (item.price <= 35 && !item.name.includes('Cake') && !item.name.includes('Tiramisu')) {
        category = categoryMap['Main Courses'];
      } else if (item.name.includes('Cake') || item.name.includes('Tiramisu')) {
        category = categoryMap['Desserts'];
      } else {
        category = categoryMap['Beverages'];
      }
      
      if (!category) {
        throw new Error(`Category not found for item: ${item.name}`);
      }
      
      return { 
        ...item, 
        category: category._id 
      };
    });

    const createdMenuItems = await MenuItem.insertMany(menuItemsWithCategories);
    console.log(`✅ Created ${createdMenuItems.length} menu items`);

    // Create a map of menu item names to their IDs
    const menuItemMap: { [key: string]: string } = {};
    createdMenuItems.forEach((item:any) => {
      menuItemMap[item.name] = item._id.toString();
    });

    console.log('Creating featured items...');
    const featuredItemsWithRefs = sampleFeaturedItems.map((item, index) => {
      let menuItemId = '';
      
      if (index === 0) menuItemId = menuItemMap['Wagyu Beef Burger'];
      else if (index === 1) menuItemId = menuItemMap['Truffle Mushroom Risotto'];
      else if (index === 2) menuItemId = menuItemMap['Chocolate Lava Cake'];
      
      if (!menuItemId) {
        throw new Error(`Menu item not found for featured item: ${item.title}`);
      }
      
      return { ...item, menuItem: menuItemId };
    });

    const createdFeaturedItems = await FeaturedItem.insertMany(featuredItemsWithRefs);
    console.log(`✅ Created ${createdFeaturedItems.length} featured items`);

    // Display summary
    console.log('\n🎉 SEEDING SUMMARY ====================');
    console.log(`📂 Categories: ${categories.length}`);
    console.log(`🍽️  Menu Items: ${createdMenuItems.length}`);
    console.log(`⭐ Featured Items: ${createdFeaturedItems.length}`);
    console.log('✅ Database seeded successfully!');
    console.log('====================================\n');

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };