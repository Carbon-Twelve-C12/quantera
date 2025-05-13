# DefaultApi

All URIs are relative to *http://localhost:3030*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**treasuriesGet**](#treasuriesget) | **GET** /treasuries | List treasuries|
|[**treasuriesIdGet**](#treasuriesidget) | **GET** /treasuries/{id} | Get treasury details|
|[**treasuriesIdYieldGet**](#treasuriesidyieldget) | **GET** /treasuries/{id}/yield | Get treasury yield information|
|[**treasuriesPost**](#treasuriespost) | **POST** /treasuries | Create a new treasury|

# **treasuriesGet**
> Array<TreasuryOverview> treasuriesGet()

List all treasuries with optional filters.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let treasuryType: 'tbill' | 'tnote' | 'tbond'; //Filter by treasury type (optional) (default to undefined)
let minYield: number; //Minimum yield (basis points) (optional) (default to undefined)
let maxMaturity: number; //Maximum maturity date (unix timestamp) (optional) (default to undefined)
let limit: number; //Page size (optional) (default to undefined)
let offset: number; //Offset for pagination (optional) (default to undefined)

const { status, data } = await apiInstance.treasuriesGet(
    treasuryType,
    minYield,
    maxMaturity,
    limit,
    offset
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **treasuryType** | [**&#39;tbill&#39; | &#39;tnote&#39; | &#39;tbond&#39;**]**Array<&#39;tbill&#39; &#124; &#39;tnote&#39; &#124; &#39;tbond&#39;>** | Filter by treasury type | (optional) defaults to undefined|
| **minYield** | [**number**] | Minimum yield (basis points) | (optional) defaults to undefined|
| **maxMaturity** | [**number**] | Maximum maturity date (unix timestamp) | (optional) defaults to undefined|
| **limit** | [**number**] | Page size | (optional) defaults to undefined|
| **offset** | [**number**] | Offset for pagination | (optional) defaults to undefined|


### Return type

**Array<TreasuryOverview>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of treasuries |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **treasuriesIdGet**
> TreasuryOverview treasuriesIdGet()

Get details for a specific treasury by ID.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: string; //Treasury ID (hex string) (default to undefined)

const { status, data } = await apiInstance.treasuriesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Treasury ID (hex string) | defaults to undefined|


### Return type

**TreasuryOverview**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Treasury details |  -  |
|**404** | Treasury not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **treasuriesIdYieldGet**
> TreasuriesIdYieldGet200Response treasuriesIdYieldGet()

Get yield information for a specific treasury by ID.

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: string; //Treasury ID (hex string) (default to undefined)

const { status, data } = await apiInstance.treasuriesIdYieldGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Treasury ID (hex string) | defaults to undefined|


### Return type

**TreasuriesIdYieldGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Yield information |  -  |
|**404** | Treasury not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **treasuriesPost**
> TreasuryOverview treasuriesPost(createTreasuryRequest)

Create a new treasury token. Requires authentication. Enforces compliance checks (KYC/AML) and uses pluggable deployment logic. Returns the created treasury overview. 

### Example

```typescript
import {
    DefaultApi,
    Configuration,
    CreateTreasuryRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let createTreasuryRequest: CreateTreasuryRequest; //

const { status, data } = await apiInstance.treasuriesPost(
    createTreasuryRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createTreasuryRequest** | **CreateTreasuryRequest**|  | |


### Return type

**TreasuryOverview**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Treasury created |  -  |
|**401** | Unauthorized or compliance check failed |  -  |
|**400** | Invalid input |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

