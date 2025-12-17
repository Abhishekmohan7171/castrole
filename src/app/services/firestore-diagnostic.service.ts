import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from '@angular/fire/firestore';

/**
 * Diagnostic service to test Firestore connectivity and query issues
 * Use this to troubleshoot the discover feed
 */
@Injectable({
  providedIn: 'root',
})
export class FirestoreDiagnosticService {
  private firestore = inject(Firestore);

  /**
   * Run comprehensive diagnostics on the discover collection
   */
  async runDiagnostics(): Promise<void> {
    console.log('🔍 Starting Firestore Diagnostics...\n');

    // Test 1: Basic connection
    await this.testConnection();

    // Test 2: Collection exists
    await this.testCollectionExists();

    // Test 3: Document structure
    await this.testDocumentStructure();

    // Test 4: Active posts
    await this.testActivePosts();

    // Test 5: Query with filters
    await this.testQueryWithFilters();

    console.log('\n✅ Diagnostics complete!');
  }

  /**
   * Test 1: Basic Firestore connection
   */
  private async testConnection(): Promise<void> {
    console.log('📡 Test 1: Testing Firestore connection...');
    try {
      const testCollection = collection(this.firestore, 'discover');
      console.log('✅ Firestore connection successful');
      console.log('   Collection reference:', testCollection.path);
    } catch (error) {
      console.error('❌ Firestore connection failed:', error);
    }
  }

  /**
   * Test 2: Check if discover collection exists and has documents
   */
  private async testCollectionExists(): Promise<void> {
    console.log('\n📚 Test 2: Checking discover collection...');
    try {
      const discoverCollection = collection(this.firestore, 'discover');
      const snapshot = await getDocs(discoverCollection);

      if (snapshot.empty) {
        console.warn('⚠️  Collection exists but is empty');
        console.log('   Action: Add at least one document to the discover collection');
      } else {
        console.log(`✅ Collection exists with ${snapshot.size} document(s)`);
      }
    } catch (error: any) {
      console.error('❌ Failed to access collection:', error);
      if (error?.code === 'permission-denied') {
        console.log('   Action: Update Firestore security rules to allow read access');
      }
    }
  }

  /**
   * Test 3: Check document structure
   */
  private async testDocumentStructure(): Promise<void> {
    console.log('\n📋 Test 3: Checking document structure...');
    try {
      const discoverCollection = collection(this.firestore, 'discover');
      const snapshot = await getDocs(query(discoverCollection, limit(1)));

      if (snapshot.empty) {
        console.warn('⚠️  No documents to check');
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      console.log('   Document ID:', doc.id);
      console.log('   Document data:', data);

      // Check required fields
      const requiredFields = [
        'authorId',
        'authorName',
        'postDate',
        'content',
        'type',
        'isFeatured',
        'isActive',
        'createdAt',
        'updatedAt',
      ];

      const missingFields = requiredFields.filter(
        (field) => !(field in data)
      );

      if (missingFields.length > 0) {
        console.warn('⚠️  Missing required fields:', missingFields);
        console.log('   Action: Add missing fields to your documents');
      } else {
        console.log('✅ All required fields present');
      }

      // Check field types
      if (typeof data['isActive'] !== 'boolean') {
        console.warn('⚠️  isActive should be boolean, got:', typeof data['isActive']);
      }

      if (!data['postDate']?.toDate) {
        console.warn('⚠️  postDate should be Firestore Timestamp, got:', typeof data['postDate']);
        console.log('   Action: Convert postDate to Firestore Timestamp');
      } else {
        console.log('✅ postDate is valid Timestamp');
      }
    } catch (error) {
      console.error('❌ Failed to check document structure:', error);
    }
  }

  /**
   * Test 4: Check for active posts
   */
  private async testActivePosts(): Promise<void> {
    console.log('\n🔍 Test 4: Checking for active posts...');
    try {
      const discoverCollection = collection(this.firestore, 'discover');
      const q = query(discoverCollection, where('isActive', '==', true));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn('⚠️  No active posts found (isActive: true)');
        console.log('   Action: Set isActive to true on at least one document');
      } else {
        console.log(`✅ Found ${snapshot.size} active post(s)`);
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   - ${doc.id}: ${data['title'] || 'No title'}`);
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to query active posts:', error);
      if (error?.code === 'failed-precondition') {
        console.log('   Action: Create composite index for isActive field');
      }
    }
  }

  /**
   * Test 5: Test the actual query used by the service
   */
  private async testQueryWithFilters(): Promise<void> {
    console.log('\n🎯 Test 5: Testing actual service query...');
    try {
      const discoverCollection = collection(this.firestore, 'discover');
      const q = query(
        discoverCollection,
        where('isActive', '==', true),
        orderBy('postDate', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn('⚠️  Query returned no results');
        console.log('   Possible causes:');
        console.log('   - No documents with isActive: true');
        console.log('   - postDate field missing or invalid');
        console.log('   - Missing composite index');
      } else {
        console.log(`✅ Query successful! Found ${snapshot.size} post(s)`);
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   - ${doc.id}:`, {
            title: data['title'],
            isActive: data['isActive'],
            postDate: data['postDate']?.toDate?.(),
          });
        });
      }
    } catch (error: any) {
      console.error('❌ Query failed:', error);
      console.log('   Error code:', error?.code);
      console.log('   Error message:', error?.message);

      if (error?.code === 'failed-precondition') {
        console.log('\n   ⚠️  MISSING INDEX!');
        console.log('   The error message should contain a link to create the index.');
        console.log('   Or create it manually in Firebase Console:');
        console.log('   Collection: discover');
        console.log('   Fields: isActive (Ascending), postDate (Descending)');
      } else if (error?.code === 'permission-denied') {
        console.log('\n   ⚠️  PERMISSION DENIED!');
        console.log('   Update Firestore rules to allow read access');
      }
    }
  }

  /**
   * Quick test - just check if we can read any documents
   */
  async quickTest(): Promise<boolean> {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'discover'));
      console.log(`✅ Quick test passed: ${snapshot.size} documents found`);
      return true;
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      return false;
    }
  }
}
