from enum import Enum
from typing import Union, Optional

import boto3
from pydantic import BaseModel

from tools import session_project
from ...integrations.models.pd.integration import SecretField


class IntegrationModel(BaseModel):
    aws_access_key: str
    aws_secret_access_key: Union[SecretField, str]
    region_name: str
    security_groups: Optional[str]
    image_id: Optional[str]
    key_name: Optional[str]

    def check_connection(self) -> bool:
        aws_secret_access_key = self.aws_secret_access_key.unsecret(session_project.get())

        ec2 = boto3.client('ec2', aws_access_key_id=self.aws_access_key,
                           aws_secret_access_key=aws_secret_access_key,
                           region_name=self.region_name)
        config = {
            "DryRun": True,
            "Type": "request",
            "TerminateInstancesWithExpiration": True,
            "LaunchTemplateConfigs": [],
            "TargetCapacitySpecification": {
                'TotalTargetCapacity': 1,
                'OnDemandTargetCapacity': 0,
                'SpotTargetCapacity': 1,
                'DefaultTargetCapacityType': 'spot',
            },
        }
        try:
            ec2.create_fleet(**config)
        except Exception as e:
            if 'DryRunOperation' not in str(e):
                return False
        return True


class InstanceType(str, Enum):
    on_demand = "on-demand"
    spot = "spot"


class PerformanceBackendTestModel(IntegrationModel):
    id: int
    project_id: Optional[int]
    instance_type: InstanceType
    cpu_cores_limit: int
    memory_limit: int
    concurrency: int
    subnet_id: Optional[str]

    class Config:
        use_enum_values = True


class PerformanceUiTestModel(PerformanceBackendTestModel):
    ...
