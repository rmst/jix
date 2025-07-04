/**
 * A custom Set class that extends the built-in Set with additional methods.
 * It can be instantiated with or without the 'new' keyword.
 *
 * @class ExtendedSet
 * @extends {Set}
 */
export class ExtendedSet extends Set {
  /**
   * Creates an instance of set.
   * This constructor allows the class to be called as a function without 'new'.
   * e.g., ExtendedSet([1, 2]) is equivalent to new ExtendedSet([1, 2]).
   * @param {Iterable<any>} [iterable] An iterable object whose elements are added to the new Set.
   */
  constructor(iterable) {
    // This check allows instantiation without the 'new' keyword.
    // If 'new.target' is undefined, the constructor was called as a function.
    // We then call it again correctly with 'new'.
    if (!new.target) {
      return new ExtendedSet(iterable);
    }

    // If called with 'new', we call the parent constructor (the built-in Set).
    super(iterable);
  }

  /**
   * Returns a new set containing all elements from this set and the other set (Set Union).
   * @param {Iterable<any>} other An iterable object.
   * @returns {ExtendedSet} A new set instance representing the union.
   */
  plus(other) {
    // Use this.constructor to create a new instance of the same class (our custom Set).
    // The spread syntax (...) combines both iterables, and the Set constructor
    // automatically handles duplicates.
    return new this.constructor([...this, ...other]);
  }

  /**
   * Returns a new Set with elements that are in this set but not in the other set (Set Difference).
   * @param {Iterable<any>} other An iterable object.
   * @returns {ExtendedSet} A new Set instance representing the difference.
   */
  minus(other) {
    // For efficient lookup (O(1) on average), ensure 'other' is a Set.
    const otherSet = new Set(other);

    // Filter the elements of the current set.
    const difference = [...this].filter(item => !otherSet.has(item));
    
    // Create a new instance of our custom Set from the filtered elements.
    return new this.constructor(difference);
  }

  // --- NEWLY IMPLEMENTED METHODS ---

  /**
   * Returns a new set with elements that are in both this set and the other set (Set Intersection).
   * @param {Iterable<any>} other An iterable object.
   * @returns {ExtendedSet} A new set instance representing the intersection.
   */
  intersect(other) {
    const otherSet = new Set(other);
    const intersection = [...this].filter(item => otherSet.has(item));
    return new this.constructor(intersection);
  }

  /**
   * Checks if all elements of this set are present in the other set.
   * @param {Iterable<any>} other An iterable object.
   * @returns {boolean} True if this set is a subset of the other.
   */
  isSubsetOf(other) {
    const otherSet = new Set(other);
    // Optimization: A set can't be a subset of a smaller set.
    if (this.size > otherSet.size) {
      return false;
    }
    // Check if every item in this set is also in the other set.
    for (const item of this) {
      if (!otherSet.has(item)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if this set contains exactly the same elements as the other set.
   * @param {Iterable<any>} other An iterable object.
   * @returns {boolean} True if the sets are equal.
   */
  equals(other) {
    const otherSet = new Set(other);
    // For two sets to be equal, they must be the same size.
    if (this.size !== otherSet.size) {
      return false;
    }
    // If sizes are equal, we only need to check if one is a subset of the other.
    return this.isSubsetOf(otherSet);
  }

  // --- EXISTING UTILITY METHOD ---

  list() {
    return [...this]
  }
}

const set = (iterable) => new ExtendedSet(iterable)

export default set