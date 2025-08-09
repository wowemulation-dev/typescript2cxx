#ifndef BIGINT_TEST_H
#define BIGINT_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

extern const js::bigint smallBigInt;
extern const js::bigint largeBigInt;
extern const js::any negativeBigInt;
void testBigIntOperations();

#endif // BIGINT_TEST_H